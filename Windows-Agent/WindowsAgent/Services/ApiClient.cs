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

    public async Task<string> SendSystemInfoAsync(SystemInfo systemInfo)
    {
        //serializing to a string first since django dev simple server does not accept chunked requests 
        var json = JsonSerializer.Serialize(systemInfo);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        var response = await _httpClient.PostAsync("api/agent/report/", content);
        var body = await response.Content.ReadAsStringAsync();
        return $"{(int)response.StatusCode} {response.ReasonPhrase}: {body}";
    }
}
