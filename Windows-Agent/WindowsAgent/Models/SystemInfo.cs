namespace WindowsAgent.Models;

//MVP Feature 1 -- full identity payload sent once at agent startup
public class SystemInfo
{
    public string Hostname { get; set; } = string.Empty;
    public string WindowsVersion { get; set; } = string.Empty;
    public string CpuModel { get; set; } = string.Empty;
    public int CpuCores { get; set; }
    public double TotalRamGb { get; set; }
    public List<DriveReport> Drives { get; set; } = new();
    public string IpAddress { get; set; } = string.Empty;
    public double UptimeHours { get; set; }
    public string LoggedInUser { get; set; } = string.Empty;
    public string NetworkAdapter { get; set; } = string.Empty;
    public string MacAddress { get; set; } = string.Empty;
}
