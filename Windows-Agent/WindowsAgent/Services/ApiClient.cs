using System.Net.Http.Json;
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

    public async Task<string> SendSystemInfoAsync(SystemInfo systemInfo)
    {
        var response = await _httpClient.PostAsJsonAsync("api/agent/report/", systemInfo);
        var body = await response.Content.ReadAsStringAsync();
        return $"{(int)response.StatusCode} {response.ReasonPhrase}: {body}";
    }
}
