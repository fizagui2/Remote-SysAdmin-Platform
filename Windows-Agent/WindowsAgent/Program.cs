using System.Net;
using System.Text.Json;
using WindowsAgent.Services;

var baseUrl = Environment.GetEnvironmentVariable("AGENT_API_BASE_URL") ?? "http://localhost:8000/";
var intervalSeconds = int.TryParse(Environment.GetEnvironmentVariable("AGENT_REPORT_INTERVAL_SECONDS"), out var seconds)
    ? seconds
    : 10;
var commandPollSeconds = int.TryParse(Environment.GetEnvironmentVariable("AGENT_COMMAND_POLL_SECONDS"), out var commandSeconds)
    ? commandSeconds
    : 1;

var apiClient = new ApiClient(baseUrl);
var hostname = Environment.MachineName;

//enrollment is a prerequisite, nothing below this runs until agent has a token
var tokenStore = new TokenStore();
var currentToken = tokenStore.Load() ?? await EnrollAsync();
apiClient.SetDeviceToken(currentToken);

//Guards re-enrollment so the reporting loop and command loop cant both
//prompt for a new code at the same time if they hit a 401 together
var reenrollLock = new SemaphoreSlim(1, 1);

var systemInfoService = new SystemInfoService();
var performanceService = new PerformanceService();
var processService = new ProcessService();
var serviceMonitorService = new ServiceMonitorService();
var commandService = new CommandService();

//feature 1 - identitiy report, sent once at startup
var systemInfo = systemInfoService.Collect();
Console.WriteLine("Collected system info:");
Console.WriteLine(JsonSerializer.Serialize(systemInfo, new JsonSerializerOptions { WriteIndented = true }));
await SendAsync(() => apiClient.SendSystemInfoAsync(systemInfo), "system info");

//features 2,3,4 - heartbeat, live performance, and process list, repeated on an interval
Console.WriteLine($"Starting reporting loop every {intervalSeconds}s and command poll every {commandPollSeconds}s. Press Ctrl+C to stop.");

var reportingLoop = Task.Run(async () =>
{
    while (true)
    {
        var heartbeat = new WindowsAgent.Models.Heartbeat
        {
            Hostname = hostname,
            Timestamp = DateTime.UtcNow.ToString("o")
        };
        await SendAsync(() => apiClient.SendHeartbeatAsync(heartbeat), "heartbeat");

        var performanceInfo = performanceService.Collect(hostname);
        await SendAsync(() => apiClient.SendPerformanceInfoAsync(performanceInfo), "performance");

        var processReport = processService.Collect(hostname);
        await SendAsync(() => apiClient.SendProcessReportAsync(processReport), "processes");

        var serviceReport = serviceMonitorService.Collect(hostname);
        await SendAsync(() => apiClient.SendServiceReportAsync(serviceReport), "services");

        await Task.Delay(TimeSpan.FromSeconds(intervalSeconds));
    }
});

//Features 5 and 7: check for queued commands (terminate a process, start/stop/
//restart a service) on its own faster loop, so commands run almost immediately
//instead of waiting on the slower reporting loop above.
var commandLoop = Task.Run(async () =>
{
    while (true)
    {
        await ExecutePendingCommandsAsync();
        await Task.Delay(TimeSpan.FromSeconds(commandPollSeconds));
    }
});

await Task.WhenAll(reportingLoop, commandLoop);

async Task<string> EnrollAsync()
{
    Console.WriteLine();
    Console.WriteLine("No device token found. Go to the Add Device page on the dashboard,");
    Console.WriteLine("log in, and generate a code, then enter it below.");

    while (true)
    {
        Console.Write("Enrollment code: ");
        var code = Console.ReadLine() ?? string.Empty;

        EnrollmentOutcome outcome;
        try
        {
            outcome = await apiClient.EnrollAsync(code, hostname);
        }
        catch (HttpRequestException ex)
        {
            Console.WriteLine($"Could not reach server: {ex.Message}");
            Console.WriteLine("Please try again.");
            continue;
        }

        if (outcome.Success && outcome.DeviceToken is not null)
        {
            tokenStore.Save(outcome.DeviceToken);
            Console.WriteLine("Enrolled successfully.");
            return outcome.DeviceToken;
        }

        Console.WriteLine($"Could not enroll: {outcome.ErrorMessage}");
        Console.WriteLine("Please try again.");
    }
}

//clears the rejected token and asks for another enrollment
async Task HandleUnauthorizedAsync(string tokenAtFailureTime)
{
    await reenrollLock.WaitAsync();
    try
    {
        if (currentToken != tokenAtFailureTime)
        {
            return;
        }

        Console.WriteLine("Device token was rejected (401) - clearing it and re-enrolling.");
        tokenStore.Delete();
        currentToken = await EnrollAsync();
        apiClient.SetDeviceToken(currentToken);
    }
    finally
    {
        reenrollLock.Release();
    }
}

async Task SendAsync(Func<Task<string>> send, string label)
{
    try
    {
        var result = await send();
        Console.WriteLine($"[{label}] {result}");
    }
    catch (UnauthorizedAccessException)
    {
        Console.WriteLine($"[{label}] Rejected: device token no longer valid.");
        await HandleUnauthorizedAsync(currentToken);
    }
    catch (HttpRequestException ex)
    {
        Console.WriteLine($"[{label}] Could not reach server: {ex.Message}");
    }
}

async Task ExecutePendingCommandsAsync()
{
    try
    {
        var commands = await apiClient.GetPendingCommandsAsync(hostname);
        if (commands.Count == 0) return;

        foreach (var command in commands)
        {
            var result = commandService.Execute(command);
            await SendAsync(() => apiClient.SendCommandResultAsync(result), $"command {command.CommandId}");
        }

        //A command just changed process or service state - push a fresh snapshot right
        //away instead of waiting for the next reporting-loop tick, so the dashboard
        //doesn't keep showing a process/service that no longer reflects reality.
        if (commands.Any(c => c.Command == "terminate_process"))
        {
            var processReport = processService.Collect(hostname);
            await SendAsync(() => apiClient.SendProcessReportAsync(processReport), "processes (post-command)");
        }
        if (commands.Any(c => c.Command is "start_service" or "stop_service" or "restart_service"))
        {
            var serviceReport = serviceMonitorService.Collect(hostname);
            await SendAsync(() => apiClient.SendServiceReportAsync(serviceReport), "services (post-command)");
        }
    }
    catch (HttpRequestException ex) when (ex.StatusCode == HttpStatusCode.Unauthorized)
    {
        Console.WriteLine("[commands] Rejected: device token no longer valid.");
        await HandleUnauthorizedAsync(currentToken);
    }
    catch (HttpRequestException ex)
    {
        Console.WriteLine($"[commands] Could not reach server: {ex.Message}");
    }
}
