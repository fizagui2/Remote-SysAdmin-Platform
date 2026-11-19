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

        var withinRoot = fullPath.Equals(fullRoot, StringComparison.OrdinalIgnoreCase)
            || fullPath.StartsWith(fullRoot + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase);

        return withinRoot && !HasReparsePointBetween(fullRoot, fullPath);
    }

    //Path.GetFullPath only resolves ".." segments, not junctions/symlinks, so a reparse point sitting
    //inside the allowed root could otherwise point anywhere on disk.
    //This walks every existing folder from the target up to the root and rejects any of them thats a link
    private static bool HasReparsePointBetween(string root, string target)
    {
        var current = target;

        while (current is not null && current.Length >= root.Length)
        {
            if (Directory.Exists(current) && new DirectoryInfo(current).Attributes.HasFlag(FileAttributes.ReparsePoint))
                return true;

            if (current.Equals(root, StringComparison.OrdinalIgnoreCase))
                break;

            current = Path.GetDirectoryName(current);
        }

        return false;
    }
}
