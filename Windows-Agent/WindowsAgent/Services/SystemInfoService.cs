using System.Net.NetworkInformation;
using System.Net.Sockets;
using Microsoft.Win32;
using WindowsAgent.Models;

namespace WindowsAgent.Services;

public class SystemInfoService
{
    public SystemInfo Collect()
    {
        var (totalRamGb, _) = NativeMemoryInfo.GetMemoryGb();
        var activeInterface = GetActiveNetworkInterface();

        return new SystemInfo
        {
            Hostname = Environment.MachineName,
            WindowsVersion = GetWindowsVersion(),
            CpuModel = GetCpuModel(),
            CpuCores = Environment.ProcessorCount,
            TotalRamGb = Math.Round(totalRamGb, 2),
            Drives = GetDrives(),
            IpAddress = GetIpAddress(activeInterface),
            UptimeHours = Math.Round(Environment.TickCount64 / 1000.0 / 3600.0, 2),
            LoggedInUser = Environment.UserName,
            NetworkAdapter = activeInterface?.Name ?? "Unknown",
            MacAddress = GetMacAddress(activeInterface)
        };
    }

    //CPU model name lives in the registry too, same approach as GetWindowsVersion
    private static string GetCpuModel()
    {
        using var key = Registry.LocalMachine.OpenSubKey(
            @"HARDWARE\DESCRIPTION\System\CentralProcessor\0");
        var name = key?.GetValue("ProcessorNameString") as string ?? "Unknown CPU";
        return name.Trim();
    }

    //only fixed internal drives are reported, not USB sticks
    private static List<DriveReport> GetDrives()
    {
        var drives = new List<DriveReport>();
        foreach (var drive in DriveInfo.GetDrives())
        {
            if (!drive.IsReady || drive.DriveType != DriveType.Fixed) continue;

            drives.Add(new DriveReport
            {
                DriveLetter = drive.Name,
                TotalGb = Math.Round(drive.TotalSize / 1024.0 / 1024.0 / 1024.0, 2),
                FreeGb = Math.Round(drive.AvailableFreeSpace / 1024.0 / 1024.0 / 1024.0, 2)
            });
        }
        return drives;
    }

    //picks the first adapter that's actually up, has an ipv4 address, and has a real default gateway. 
    //this is because vmware/virtualboxes have ipv4 addresses too but don't have a gateway, which means
    //it can accidentally be icked up first before the real wifi/internet connection.
    private static NetworkInterface? GetActiveNetworkInterface()
    {
        return NetworkInterface.GetAllNetworkInterfaces().FirstOrDefault(nic =>
            nic.OperationalStatus == OperationalStatus.Up &&
            nic.NetworkInterfaceType != NetworkInterfaceType.Loopback &&
            nic.GetIPProperties().UnicastAddresses.Any(a => a.Address.AddressFamily == AddressFamily.InterNetwork) &&
            nic.GetIPProperties().GatewayAddresses.Any(g => g.Address.AddressFamily == AddressFamily.InterNetwork));
    }

    private static string GetIpAddress(NetworkInterface? nic)
    {
        var address = nic?.GetIPProperties().UnicastAddresses
            .FirstOrDefault(a => a.Address.AddressFamily == AddressFamily.InterNetwork);
        return address?.Address.ToString() ?? "Unknown";
    }

    private static string GetMacAddress(NetworkInterface? nic)
    {
        if (nic == null) return "Unknown";
        var bytes = nic.GetPhysicalAddress().GetAddressBytes();
        return string.Join("-", bytes.Select(b => b.ToString("X2")));
    }

    //environment.OSVersion mistakes Windows 11 as "Windows 10" bc of
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
