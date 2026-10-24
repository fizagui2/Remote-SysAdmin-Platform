namespace WindowsAgent.Models;

//One row in the locally saved recent actions history (Terminate/Start/Stop/Restart). Its cleared alongside
//the device token on unenroll/re-enroll so a future owner of this PC never sees what a previous account did on it
public class ActionHistoryEntry
{
    public DateTime Timestamp { get; set; } = DateTime.Now;
    public string Description { get; set; } = string.Empty;
    public bool Success { get; set; }
}
