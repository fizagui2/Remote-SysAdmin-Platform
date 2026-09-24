namespace WindowsAgent.Models;

//covers both command shapes from the schema doc: terminate_process uses Pid,
//start/stop/restart_service use ServiceName -- the unused one is just null
public class AgentCommand
{
    public int CommandId { get; set; }
    public string Command { get; set; } = string.Empty;
    public string Hostname { get; set; } = string.Empty;
    public int? Pid { get; set; }
    public string? ServiceName { get; set; }
}
