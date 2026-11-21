namespace WindowsAgent.Models;

//covers every command shape from the schema doc: terminate_process uses Pid, start/stop/restart_service
//use ServiceName, create_folder/list_directory/move_path use FilePath whichever ones a given command 
//doesnt need are just null
public class AgentCommand
{
    public int CommandId { get; set; }
    public string Command { get; set; } = string.Empty;
    public string Hostname { get; set; } = string.Empty;
    public int? Pid { get; set; }
    public string? ServiceName { get; set; }
    public string? FilePath { get; set; }
    public string? NewPath { get; set; }
}
