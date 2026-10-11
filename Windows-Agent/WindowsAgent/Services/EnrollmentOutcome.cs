namespace WindowsAgent.Services;

//result of one enrollment attempt, similar to ApiClient reporting success and failure back to program.cs
//reather than throwing the expected bad code case
public class EnrollmentOutcome
{
    public bool Success { get; set; }
    public string? DeviceToken { get; set; }
    public string? ErrorMessage { get; set; }
}
