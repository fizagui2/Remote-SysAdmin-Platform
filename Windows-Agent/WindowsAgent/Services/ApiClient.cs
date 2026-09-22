using System.Text;
using System.Text.Json;
using WindowsAgent.Models;

namespace WindowsAgent.Services;

//minimal client for sending agent data to the Django REST API
//the base URL is passed in rather than hardcoded so it's easy to point at localhost during development and at a real host later
public class ApiClient
{
    private readonly HttpClient _httpClient;

    public ApiClient(string baseUrl)
    {
        _httpClient = new HttpClient { BaseAddress = new Uri(baseUrl) };
    }

    public Task<string> SendSystemInfoAsync(SystemInfo systemInfo) =>
        PostAsync(systemInfo, "api/agent/report/");

    public Task<string> SendHeartbeatAsync(Heartbeat heartbeat) =>
        PostAsync(heartbeat, "api/agent/heartbeat/");

    public Task<string> SendPerformanceInfoAsync(PerformanceInfo performanceInfo) =>
        PostAsync(performanceInfo, "api/agent/performance/");

    public Task<string> SendProcessReportAsync(ProcessReport processReport) =>
        PostAsync(processReport, "api/agent/processes/");

    //serializing to a string first since django's dev server does not accept chunked requests
    //shared by every Send*Async method above so that fix only lives in one place
    private async Task<string> PostAsync<T>(T payload, string path)
    {
        var json = JsonSerializer.Serialize(payload);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        var response = await _httpClient.PostAsync(path, content);
        var body = await response.Content.ReadAsStringAsync();
        return $"{(int)response.StatusCode} {response.ReasonPhrase}: {body}";
    }
}
