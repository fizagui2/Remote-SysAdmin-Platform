using System.Text.Json;
using WindowsAgent.Services;

var baseUrl = Environment.GetEnvironmentVariable("AGENT_API_BASE_URL") ?? "http://localhost:8000/";
var intervalSeconds = int.TryParse(Environment.GetEnvironmentVariable("AGENT_REPORT_INTERVAL_SECONDS"), out var seconds)
    ? seconds
    : 10;

var apiClient = new ApiClient(baseUrl);
var systemInfoService = new SystemInfoService();
var performanceService = new PerformanceService();
var processService = new ProcessService();

var hostname = Environment.MachineName;

//feature 1 - identitiy report, sent once at startup
var systemInfo = systemInfoService.Collect();
Console.WriteLine("Collected system info:");
Console.WriteLine(JsonSerializer.Serialize(systemInfo, new JsonSerializerOptions { WriteIndented = true }));
await SendAsync(() => apiClient.SendSystemInfoAsync(systemInfo), "system info");

//features 2,3,4 - heartbeat, live performance, and process list, repeated on an interval
Console.WriteLine($"Starting reporting loop every {intervalSeconds}s. Press Ctrl+C to stop.");

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

    await Task.Delay(TimeSpan.FromSeconds(intervalSeconds));
}

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
