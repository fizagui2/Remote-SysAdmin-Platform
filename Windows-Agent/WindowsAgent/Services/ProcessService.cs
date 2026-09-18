using System.Diagnostics;
using WindowsAgent.Models;

namespace WindowsAgent.Services;

public class ProcessService
{
    public ProcessReport Collect(string hostname)
    {
        var processes = new List<ProcessEntry>();

        foreach (var process in Process.GetProcesses())
        {
            try
            {
                //this will only report processes with a visible window or what Alt+Tab would
                //show, otherwise there would be WAY too many processes shown and difficult for 
                //a person to understand.
                if (string.IsNullOrEmpty(process.MainWindowTitle)) continue;

                processes.Add(new ProcessEntry
                {
                    Name = process.ProcessName,
                    Pid = process.Id,
                    MemoryMb = Math.Round(process.WorkingSet64 / 1024.0 / 1024.0, 1)
                });
            }
            catch
            {
                //some system/protected processes deny access to their info,so skip rather than crash
            }
            finally
            {
                process.Dispose();
            }
        }

        return new ProcessReport
        {
            Hostname = hostname,
            Timestamp = DateTime.UtcNow.ToString("o"),
            Processes = processes
        };
    }
}
