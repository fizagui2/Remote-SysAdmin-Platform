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

    public Task<string> SendServiceReportAsync(ServiceReport serviceReport) =>
        PostAsync(serviceReport, "api/agent/services/");

    public Task<string> SendCommandResultAsync(CommandResult result) =>
        PostAsync(result, "api/agent/commands/result/");

    //Django can't reach the agent directly (it isn't a server), so instead the agent
    //asks Django for any queued commands on the same interval as everything else
    public async Task<List<AgentCommand>> GetPendingCommandsAsync(string hostname)
    {
        var response = await _httpClient.GetAsync($"api/agent/commands/?hostname={Uri.EscapeDataString(hostname)}");
        response.EnsureSuccessStatusCode();

        var body = await response.Content.ReadAsStringAsync();
        return JsonSerializer.Deserialize<List<AgentCommand>>(body) ?? new List<AgentCommand>();
    }

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
