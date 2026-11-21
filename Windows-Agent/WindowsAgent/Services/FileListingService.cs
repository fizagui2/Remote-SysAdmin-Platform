using WindowsAgent.Models;

namespace WindowsAgent.Services;

//features 23/24, only used when called, not apart of the loop as that would not be necessary info
public class FileListingService
{
    public FileListingReport Collect(string hostname, string path, int commandId)
    {
        var entries = new List<FileEntry>();

        foreach (var dir in Directory.GetDirectories(path))
        {
            var info = new DirectoryInfo(dir);
            entries.Add(new FileEntry
            {
                Name = info.Name,
                IsDirectory = true,
                SizeBytes = 0,
                ModifiedUtc = info.LastWriteTimeUtc.ToString("o"),
            });
        }

        foreach (var file in Directory.GetFiles(path))
        {
            var info = new FileInfo(file);
            entries.Add(new FileEntry
            {
                Name = info.Name,
                IsDirectory = false,
                SizeBytes = info.Length,
                ModifiedUtc = info.LastWriteTimeUtc.ToString("o"),
            });
        }

        return new FileListingReport
        {
            CommandId = commandId,
            Hostname = hostname,
            Timestamp = DateTime.UtcNow.ToString("o"),
            Path = path,
            Entries = entries,
        };
    }
}
