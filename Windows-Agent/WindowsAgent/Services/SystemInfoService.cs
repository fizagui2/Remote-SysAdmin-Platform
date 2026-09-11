using Microsoft.Win32;
using WindowsAgent.Models;

namespace WindowsAgent.Services;

public class SystemInfoService
{
    public SystemInfo Collect()
    {
        return new SystemInfo
        {
            Hostname = Environment.MachineName,
            WindowsVersion = GetWindowsVersion()
        };
    }

    //Environment.OSVersion mistakes Windows 11 as "Windows 10" bc of
    //compatibility issues, so it reads the real product info from the registry
    private static string GetWindowsVersion()
    {
        using var key = Registry.LocalMachine.OpenSubKey(
            @"SOFTWARE\Microsoft\Windows NT\CurrentVersion");

        var productName = key?.GetValue("ProductName") as string ?? "Unknown Windows Version";
        var displayVersion = key?.GetValue("DisplayVersion") as string;
        var buildNumber = key?.GetValue("CurrentBuildNumber") as string;

        //productName still says "Windows 10" on most Windows 11 installs, Build 22000+ is Windows 11
        if (productName.StartsWith("Windows 10", StringComparison.OrdinalIgnoreCase)
            && int.TryParse(buildNumber, out var build)
            && build >= 22000)
        {
            productName = productName.Replace("Windows 10", "Windows 11");
        }

        return string.IsNullOrEmpty(displayVersion)
            ? $"{productName} (Build {buildNumber})"
            : $"{productName} {displayVersion} (Build {buildNumber})";
    }
}
