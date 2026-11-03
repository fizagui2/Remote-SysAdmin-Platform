using WindowsAgent.Services;
using Brush = System.Windows.Media.Brush;
using SolidColorBrush = System.Windows.Media.SolidColorBrush;
using Color = System.Windows.Media.Color;

namespace WindowsAgent;

//one line in the activity log, keeps the color decision here
public class LogEntry
{
    public DateTime Timestamp { get; } = DateTime.Now;
    public string Message { get; }
    public LogSeverity Severity { get; }
    public string TimeText => Timestamp.ToString("HH:mm:ss");

    public Brush Brush => Severity switch
    {
        LogSeverity.Success => new SolidColorBrush(Color.FromRgb(0x22, 0xC5, 0x5E)),
        LogSeverity.Warning => new SolidColorBrush(Color.FromRgb(0xF5, 0x9E, 0x0B)),
        LogSeverity.Error => new SolidColorBrush(Color.FromRgb(0xEF, 0x44, 0x44)),
        _ => new SolidColorBrush(Color.FromRgb(0xE6, 0xED, 0xF7)),
    };

    public LogEntry(string message, LogSeverity severity)
    {
        Message = message;
        Severity = severity;
    }
}
