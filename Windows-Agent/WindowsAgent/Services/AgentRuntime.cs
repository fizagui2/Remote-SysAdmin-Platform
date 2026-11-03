using System.Diagnostics;
using System.Net;
using WindowsAgent.Models;

namespace WindowsAgent.Services;

public enum LogSeverity { Info, Success, Warning, Error }

public class AgentLogEventArgs : EventArgs
{
    public string Message { get; }
    public LogSeverity Severity { get; }

    public AgentLogEventArgs(string message, LogSeverity severity)
    {
        Message = message;
        Severity = severity;
    }
}

//owns all agents background work such as enrollment, report loop, and command loop. Old console blocked
//console.readline for enrollment, this version raises events instead so UI can show its prompt and status
public class AgentRuntime
{
    private readonly ApiClient _apiClient;
    private readonly TokenStore _tokenStore = new();
    private readonly ActionHistoryStore _historyStore = new();
    private readonly SystemInfoService _systemInfoService = new();
    private readonly PerformanceService _performanceService = new();
    private readonly ProcessService _processService = new();
    private readonly ServiceMonitorService _serviceMonitorService = new();
    private readonly CommandService _commandService = new();

    //guards re-enrollment so report/command loop cant both prompt for new code at same time if 401 is hit
    private readonly SemaphoreSlim _reenrollLock = new(1, 1);

    private readonly string _hostname = Environment.MachineName;
    private readonly int _intervalSeconds;
    private readonly int _commandPollSeconds;

    private string? _currentToken;
    private TaskCompletionSource<string>? _pendingEnrollment;

    public string Hostname => _hostname;

    public event EventHandler<AgentLogEventArgs>? LogRaised;
    public event EventHandler? EnrollmentRequired;
    public event EventHandler? EnrollmentSucceeded;
    public event EventHandler<bool>? ConnectionStatusChanged;
    public event EventHandler<ActionHistoryEntry>? ActionRecorded;

    //UI calls this once at startup to show history that already happened to be saved before last closed
    public List<ActionHistoryEntry> LoadHistory() => _historyStore.Load();

    //lets UI clear button wipe saved history, separate from the automatic wipe when unerolled/re-enrolled
    public void ClearActionHistory() => _historyStore.Clear();

    public AgentRuntime(string baseUrl, int intervalSeconds, int commandPollSeconds)
    {
        _apiClient = new ApiClient(baseUrl);
        _intervalSeconds = intervalSeconds;
        _commandPollSeconds = commandPollSeconds;
    }

    public async Task StartAsync()
    {
        _currentToken = _tokenStore.Load();
        if (_currentToken is null)
        {
            Log("No device token found. Enter an enrollment code to get started.", LogSeverity.Info);
            _currentToken = await RequestEnrollmentAsync();
        }
        _apiClient.SetDeviceToken(_currentToken);
        EnrollmentSucceeded?.Invoke(this, EventArgs.Empty);

        //feature 1 - identity report, sent once at startup
        var systemInfo = _systemInfoService.Collect();
        Log($"Collected system info for {_hostname}.", LogSeverity.Info);
        await SendAsync(() => _apiClient.SendSystemInfoAsync(systemInfo), "system info");

        Log($"Reporting every {_intervalSeconds}s, checking for commands every {_commandPollSeconds}s.", LogSeverity.Info);

        _ = Task.Run(ReportingLoopAsync);
        _ = Task.Run(CommandLoopAsync);
    }

    //called by the UI when the user submits whatever they typed into the code box
    public async Task<EnrollmentOutcome> SubmitEnrollmentCodeAsync(string code)
    {
        if (string.IsNullOrWhiteSpace(code))
        {
            return new EnrollmentOutcome { Success = false, ErrorMessage = "Please enter a code." };
        }

        EnrollmentOutcome outcome;
        try
        {
            outcome = await _apiClient.EnrollAsync(code, _hostname);
        }
        catch (HttpRequestException ex)
        {
            var message = $"Could not reach server: {ex.Message}";
            Log(message, LogSeverity.Error);
            return new EnrollmentOutcome { Success = false, ErrorMessage = message };
        }

        if (outcome.Success && outcome.DeviceToken is not null)
        {
            _tokenStore.Save(outcome.DeviceToken);
            Log("Enrolled successfully.", LogSeverity.Success);
            _pendingEnrollment?.TrySetResult(outcome.DeviceToken);
        }
        else
        {
            Log($"Could not enroll: {outcome.ErrorMessage}", LogSeverity.Error);
        }

        return outcome;
    }

    private Task<string> RequestEnrollmentAsync()
    {
        _pendingEnrollment = new TaskCompletionSource<string>();
        EnrollmentRequired?.Invoke(this, EventArgs.Empty);
        return _pendingEnrollment.Task;
    }

    private async Task ReportingLoopAsync()
    {
        while (true)
        {
            var heartbeat = new Heartbeat { Hostname = _hostname, Timestamp = DateTime.UtcNow.ToString("o") };
            await SendAsync(() => _apiClient.SendHeartbeatAsync(heartbeat), "heartbeat");

            var performanceInfo = _performanceService.Collect(_hostname);
            await SendAsync(() => _apiClient.SendPerformanceInfoAsync(performanceInfo), "performance");

            var processReport = _processService.Collect(_hostname);
            await SendAsync(() => _apiClient.SendProcessReportAsync(processReport), "processes");

            var serviceReport = _serviceMonitorService.Collect(_hostname);
            await SendAsync(() => _apiClient.SendServiceReportAsync(serviceReport), "services");

            await Task.Delay(TimeSpan.FromSeconds(_intervalSeconds));
        }
    }

    //features 5 and 7: check for queued commands (terminate a process, start/stop/restart a service) on
    //its own faster loop, so commands run almost immediately instead of waiting on the slower reporting loop above
    private async Task CommandLoopAsync()
    {
        while (true)
        {
            await ExecutePendingCommandsAsync();
            await Task.Delay(TimeSpan.FromSeconds(_commandPollSeconds));
        }
    }

    //clears the rejected token and asks for another enrollment. Returns whether call was the one that
    //re-enrolled, false means another loop already handled failure
    private async Task<bool> HandleUnauthorizedAsync(string? tokenAtFailureTime)
    {
        await _reenrollLock.WaitAsync();
        try
        {
            if (_currentToken != tokenAtFailureTime)
            {
                return false;
            }

            Log("Device token was rejected - clearing it and asking for a new enrollment code.", LogSeverity.Warning);
            ForgetDevice();
            _currentToken = await RequestEnrollmentAsync();
            _apiClient.SetDeviceToken(_currentToken);
            EnrollmentSucceeded?.Invoke(this, EventArgs.Empty);
            return true;
        }
        finally
        {
            _reenrollLock.Release();
        }
    }

    //one place where device token and history get cleared together so that they go out of sync. any future
    //unenroll should call this instead of deleting the token on its own. Otherwise, a pc thats re-enrolled
    //under a different account would still show previous account history
    private void ForgetDevice()
    {
        _tokenStore.Delete();
        _historyStore.Clear();
    }

    //fresh enrollment may long on a new computer row, so resend it once re-enrollment suceeds. Called after
    //HandleUnauthorizedAsync has already released reenrollLock
    private async Task ResendSystemInfoAsync()
    {
        var systemInfo = _systemInfoService.Collect();
        await SendAsync(() => _apiClient.SendSystemInfoAsync(systemInfo), "system info (post re-enroll)");
    }

    private async Task SendAsync(Func<Task<string>> send, string label)
    {
        try
        {
            var result = await send();
            Log($"[{label}] {result}", LogSeverity.Info);
            ConnectionStatusChanged?.Invoke(this, true);
        }
        catch (UnauthorizedAccessException)
        {
            Log($"[{label}] Rejected: device token no longer valid.", LogSeverity.Warning);
            if (await HandleUnauthorizedAsync(_currentToken))
            {
                await ResendSystemInfoAsync();
            }
        }
        catch (HttpRequestException ex)
        {
            Log($"[{label}] Could not reach server: {ex.Message}", LogSeverity.Error);
            ConnectionStatusChanged?.Invoke(this, false);
        }
    }

    private async Task ExecutePendingCommandsAsync()
    {
        try
        {
            var commands = await _apiClient.GetPendingCommandsAsync(_hostname);
            if (commands.Count == 0) return;

            foreach (var command in commands)
            {
                //grab the process family name before killed, pid is still valid at this point
                var processName = TryGetProcessName(command);

                var result = _commandService.Execute(command);
                var detail = string.IsNullOrEmpty(result.Message) ? "" : $" - {result.Message}";
                Log($"Command '{command.Command}': {result.Status}{detail}",
                    result.Status == "success" ? LogSeverity.Success : LogSeverity.Error);
                await SendAsync(() => _apiClient.SendCommandResultAsync(result), $"command {command.CommandId}");

                var entry = new ActionHistoryEntry
                {
                    Description = DescribeCommand(command, processName),
                    Success = result.Status == "success",
                };
                _historyStore.Append(entry);
                ActionRecorded?.Invoke(this, entry);
            }

            //a command just changed process or service state, push a new snapshot right away instead of waiting
            //for the next report loop tick
            if (commands.Any(c => c.Command == "terminate_process"))
            {
                var processReport = _processService.Collect(_hostname);
                await SendAsync(() => _apiClient.SendProcessReportAsync(processReport), "processes (post-command)");
            }
            if (commands.Any(c => c.Command is "start_service" or "stop_service" or "restart_service"))
            {
                var serviceReport = _serviceMonitorService.Collect(_hostname);
                await SendAsync(() => _apiClient.SendServiceReportAsync(serviceReport), "services (post-command)");
            }
        }
        catch (HttpRequestException ex) when (ex.StatusCode == HttpStatusCode.Unauthorized)
        {
            Log("[commands] Rejected: device token no longer valid.", LogSeverity.Warning);
            if (await HandleUnauthorizedAsync(_currentToken))
            {
                await ResendSystemInfoAsync();
            }
        }
        catch (HttpRequestException ex)
        {
            Log($"[commands] Could not reach server: {ex.Message}", LogSeverity.Error);
            ConnectionStatusChanged?.Invoke(this, false);
        }
    }

    private void Log(string message, LogSeverity severity)
    {
        LogRaised?.Invoke(this, new AgentLogEventArgs(message, severity));
    }

    //process may already be gone when this runs, which means history entry falls back to showing the bare PID
    private static string? TryGetProcessName(AgentCommand command)
    {
        if (command.Command != "terminate_process" || command.Pid is not int pid)
        {
            return null;
        }

        try
        {
            return Process.GetProcessById(pid).ProcessName;
        }
        catch
        {
            return null;
        }
    }

    private static string DescribeCommand(AgentCommand command, string? processName) => command.Command switch
    {
        "terminate_process" => processName is not null
            ? $"Terminated {processName} (PID {command.Pid})"
            : $"Terminated process (PID {command.Pid})",
        "start_service" => $"Started service '{command.ServiceName}'",
        "stop_service" => $"Stopped service '{command.ServiceName}'",
        "restart_service" => $"Restarted service '{command.ServiceName}'",
        _ => $"Ran command '{command.Command}'",
    };
}
