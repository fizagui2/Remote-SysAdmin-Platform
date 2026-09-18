using System.Runtime.InteropServices;

namespace WindowsAgent.Services;

//shared by SystemInfoService (total RAM) and PerformanceService (used/available RAM)
//so the P/Invoke declaration only lives in one place
internal static class NativeMemoryInfo
{
    [DllImport("kernel32.dll")]
    private static extern bool GlobalMemoryStatusEx(ref MEMORYSTATUSEX buffer);

    [StructLayout(LayoutKind.Sequential)]
    private struct MEMORYSTATUSEX
    {
        public uint dwLength;
        public uint dwMemoryLoad;
        public ulong ullTotalPhys;
        public ulong ullAvailPhys;
        public ulong ullTotalPageFile;
        public ulong ullAvailPageFile;
        public ulong ullTotalVirtual;
        public ulong ullAvailVirtual;
        public ulong ullAvailExtendedVirtual;
    }

    public static (double TotalGb, double AvailableGb) GetMemoryGb()
    {
        var status = new MEMORYSTATUSEX
        {
            dwLength = (uint)Marshal.SizeOf<MEMORYSTATUSEX>()
        };
        GlobalMemoryStatusEx(ref status);

        var totalGb = status.ullTotalPhys / 1024.0 / 1024.0 / 1024.0;
        var availableGb = status.ullAvailPhys / 1024.0 / 1024.0 / 1024.0;
        return (totalGb, availableGb);
    }
}
