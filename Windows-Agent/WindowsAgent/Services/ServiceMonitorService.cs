using System.ServiceProcess;
using WindowsAgent.Models;

namespace WindowsAgent.Services;

public class ServiceMonitorService
{
    public ServiceReport Collect(string hostname)
    {
        var services = new List<ServiceEntry>();

        foreach (var service in ServiceController.GetServices())
        {
            try
            {
                services.Add(new ServiceEntry
                {
                    Name = service.ServiceName,
                    DisplayName = service.DisplayName,
                    Status = service.Status.ToString()
                });
            }
            catch
            {
                //some services can throw when queried so skip rather than crash
            }
            finally
            {
                service.Dispose();
            }
        }

        return new ServiceReport
        {
            Hostname = hostname,
            Timestamp = DateTime.UtcNow.ToString("o"),
            Services = services
        };
    }
}
