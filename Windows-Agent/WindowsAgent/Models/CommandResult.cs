namespace WindowsAgent.Models;

public class CommandResult
{
    public int CommandId { get; set; }
    public string Status { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}
