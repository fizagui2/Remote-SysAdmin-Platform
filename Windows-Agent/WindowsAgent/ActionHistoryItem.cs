using WindowsAgent.Models;
using Brush = System.Windows.Media.Brush;
using SolidColorBrush = System.Windows.Media.SolidColorBrush;
using Color = System.Windows.Media.Color;

namespace WindowsAgent;

//wraps a ActionHistoryEntry for display, keeps plain json model free of wfp 
public class ActionHistoryItem
{
    public string TimeText { get; }
    public string Description { get; }
    public bool Success { get; }
    public string Icon => Success ? "✓" : "✕";

    public Brush IconBrush => Success
        ? new SolidColorBrush(Color.FromRgb(0x22, 0xC5, 0x5E))
        : new SolidColorBrush(Color.FromRgb(0xEF, 0x44, 0x44));

    public ActionHistoryItem(ActionHistoryEntry entry)
    {
        TimeText = entry.Timestamp.ToString("MMM d, h:mm tt");
        Description = entry.Description;
        Success = entry.Success;
    }
}
