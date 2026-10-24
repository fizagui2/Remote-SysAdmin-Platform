using System.Text.Json;
using WindowsAgent.Models;

namespace WindowsAgent.Services;

//Persists teh recent action list shown in the UI, same folder as the device token. Cleared with the token
//when the device is unenrolled/re-enrolled. So a new owner of the device never sees previous history
public class ActionHistoryStore
{
    private const int MaxEntries = 200;

    private static readonly string FilePath = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
        "RemoteSysAdminAgent",
        "action-history.json");

    public List<ActionHistoryEntry> Load()
    {
        if (!File.Exists(FilePath)) return new List<ActionHistoryEntry>();
        try
        {
            var json = File.ReadAllText(FilePath);
            return JsonSerializer.Deserialize<List<ActionHistoryEntry>>(json) ?? new List<ActionHistoryEntry>();
        }
        catch
        {
            //corrupt/unreadable history file doesnt stop the agent from
            //starting, just treats as theres no history yet
            return new List<ActionHistoryEntry>();
        }
    }

    public void Append(ActionHistoryEntry entry)
    {
        var entries = Load();
        entries.Add(entry);
        if (entries.Count > MaxEntries)
        {
            entries.RemoveRange(0, entries.Count - MaxEntries);
        }

        Directory.CreateDirectory(Path.GetDirectoryName(FilePath)!);
        File.WriteAllText(FilePath, JsonSerializer.Serialize(entries));
    }

    public void Clear()
    {
        if (File.Exists(FilePath))
        {
            File.Delete(FilePath);
        }
    }
}
