using System.Diagnostics;
using WindowsAgent.Models;

namespace WindowsAgent.Services;

public class PerformanceService
{
    //kept alive for the whole agent run so repeated calls read real deltas
    //first call after creation returns 0 - fine since this runs on a loop, not once
    private readonly PerformanceCounter _cpuCounter = new("Processor", "% Processor Time", "_Total");

    public PerformanceInfo Collect(string hostname)
    {
        var cpuUsagePercent = Math.Round(_cpuCounter.NextValue(), 1);

        var (totalRamGb, availableRamGb) = NativeMemoryInfo.GetMemoryGb();
        var usedRamGb = totalRamGb - availableRamGb;
        var memoryUsagePercent = Math.Round(usedRamGb / totalRamGb * 100.0, 1);

        return new PerformanceInfo
        {
            Hostname = hostname,
            Timestamp = DateTime.UtcNow.ToString("o"),
            CpuUsagePercent = cpuUsagePercent,
            MemoryUsagePercent = memoryUsagePercent,
            MemoryUsedGb = Math.Round(usedRamGb, 2),
            MemoryAvailableGb = Math.Round(availableRamGb, 2),
            Drives = GetDriveUsage()
        };
    }

    private static List<DriveUsageReport> GetDriveUsage()
    {
        var drives = new List<DriveUsageReport>();
        foreach (var drive in DriveInfo.GetDrives())
        {
            if (!drive.IsReady || drive.DriveType != DriveType.Fixed) continue;

            var totalGb = drive.TotalSize / 1024.0 / 1024.0 / 1024.0;
            var freeGb = drive.AvailableFreeSpace / 1024.0 / 1024.0 / 1024.0;
            var usagePercent = totalGb == 0 ? 0 : (totalGb - freeGb) / totalGb * 100.0;

            drives.Add(new DriveUsageReport
            {
                DriveLetter = drive.Name,
                UsagePercent = Math.Round(usagePercent, 1),
                FreeGb = Math.Round(freeGb, 2)
            });
        }
        return drives;
    }
}
