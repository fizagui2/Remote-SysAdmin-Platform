namespace WindowsAgent.Models;

//MVP Feature 1, fields are added as each piece of system info is collected 
//hostname/version first; CPU, RAM, disk, IP, uptime, user, and MAC later on
public class SystemInfo
{
    public string Hostname { get; set; } = string.Empty;
    public string WindowsVersion { get; set; } = string.Empty;
}
