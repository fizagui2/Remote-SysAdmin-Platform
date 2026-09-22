namespace WindowsAgent.Models;

public class PerformanceInfo
{
    public string Hostname { get; set; } = string.Empty;
    public string Timestamp { get; set; } = string.Empty;
    public double CpuUsagePercent { get; set; }
    public double MemoryUsagePercent { get; set; }
    public double MemoryUsedGb { get; set; }
    public double MemoryAvailableGb { get; set; }
    public List<DriveUsageReport> Drives { get; set; } = new();
}

public class DriveUsageReport
{
    public string DriveLetter { get; set; } = string.Empty;
    public double UsagePercent { get; set; }
    public double FreeGb { get; set; }
}
