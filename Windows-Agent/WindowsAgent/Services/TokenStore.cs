namespace WindowsAgent.Services;

//persists the device token issues at enrollment so the agent doesnt have to re enroll every restart.
//stored under localappdata and not the project folder since the .exe can be ran from anywhere
public class TokenStore
{
    private static readonly string FilePath = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
        "RemoteSysAdminAgent",
        "device-token.txt");

    public string? Load()
    {
        if (!File.Exists(FilePath)) return null;
        var token = File.ReadAllText(FilePath).Trim();
        return string.IsNullOrEmpty(token) ? null : token;
    }

    public void Save(string token)
    {
        Directory.CreateDirectory(Path.GetDirectoryName(FilePath)!);
        File.WriteAllText(FilePath, token);
    }

    public void Delete()
    {
        if (File.Exists(FilePath))
        {
            File.Delete(FilePath);
        }
    }
}
