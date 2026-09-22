namespace WindowsAgent.Models;

public class ProcessReport
{
    public string Hostname { get; set; } = string.Empty;
    public string Timestamp { get; set; } = string.Empty;
    public List<ProcessEntry> Processes { get; set; } = new();
}

public class ProcessEntry
{
    public string Name { get; set; } = string.Empty;
    public int Pid { get; set; }
    public double MemoryMb { get; set; }
}
