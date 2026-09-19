namespace WindowsAgent.Models;

public class DriveReport
{
    public string DriveLetter { get; set; } = string.Empty;
    public double TotalGb { get; set; }
    public double FreeGb { get; set; }
}
