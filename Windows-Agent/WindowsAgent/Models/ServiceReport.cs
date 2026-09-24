namespace WindowsAgent.Models;

public class ServiceReport
{
    public string Hostname { get; set; } = string.Empty;
    public string Timestamp { get; set; } = string.Empty;
    public List<ServiceEntry> Services { get; set; } = new();
}

public class ServiceEntry
{
    public string Name { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
}
