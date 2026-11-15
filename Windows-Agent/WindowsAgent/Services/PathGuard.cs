namespace WindowsAgent.Services;

//keeps every file command specific to the logged in users own profile folder
public static class PathGuard
{
    public static readonly string AllowedRoot = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);

    public static bool IsAllowed(string? path)
    {
        if (string.IsNullOrWhiteSpace(path))
            return false;

        string fullPath;
        string fullRoot;
        try
        {
            fullPath = Path.GetFullPath(path);
            fullRoot = Path.GetFullPath(AllowedRoot);
        }
        catch
        {
            return false;
        }

        return fullPath.Equals(fullRoot, StringComparison.OrdinalIgnoreCase)
            || fullPath.StartsWith(fullRoot + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase);
    }
}
