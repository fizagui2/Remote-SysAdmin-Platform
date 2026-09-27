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
var systemInfoService = new SystemInfoService();
var performanceService = new PerformanceService();
var processService = new ProcessService();
var serviceMonitorService = new ServiceMonitorService();
var commandService = new CommandService();

var hostname = Environment.MachineName;

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

async Task SendAsync(Func<Task<string>> send, string label)
{
    try
    {
        var result = await send();
        Console.WriteLine($"[{label}] {result}");
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
        foreach (var command in commands)
        {
            var result = commandService.Execute(command);
            await SendAsync(() => apiClient.SendCommandResultAsync(result), $"command {command.CommandId}");
        }
    }
    catch (HttpRequestException ex)
    {
        Console.WriteLine($"[commands] Could not reach server: {ex.Message}");
    }
}
