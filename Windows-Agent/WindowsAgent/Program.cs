using System.Text.Json;
using WindowsAgent.Services;

var systemInfoService = new SystemInfoService();
var systemInfo = systemInfoService.Collect();

var json = JsonSerializer.Serialize(systemInfo, new JsonSerializerOptions { WriteIndented = true });
Console.WriteLine("Collected system info:");
Console.WriteLine(json);

var baseUrl = Environment.GetEnvironmentVariable("AGENT_API_BASE_URL") ?? "http://localhost:8000/";
var apiClient = new ApiClient(baseUrl);
try
{
    var result = await apiClient.SendSystemInfoAsync(systemInfo);
    Console.WriteLine($"Server response: {result}");
}
catch (HttpRequestException ex)
{
    Console.WriteLine($"Could not reach server: {ex.Message}");
}
