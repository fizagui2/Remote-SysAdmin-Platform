namespace WindowsAgent.Models;

public class FileListingReport
{
    public string Hostname { get; set; } = string.Empty;
    public string Timestamp { get; set; } = string.Empty;
    public string Path { get; set; } = string.Empty;
    public List<FileEntry> Entries { get; set; } = new();
}

public class FileEntry
{
    public string Name { get; set; } = string.Empty;
    public bool IsDirectory { get; set; }
    public long SizeBytes { get; set; }
    public string ModifiedUtc { get; set; } = string.Empty;
}
