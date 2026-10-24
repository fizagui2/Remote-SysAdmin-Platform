using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Windows;
using System.Windows.Input;
using System.Windows.Threading;
using WindowsAgent.Models;
using WindowsAgent.Services;
using Brush = System.Windows.Media.Brush;

namespace WindowsAgent;

public partial class MainWindow : Window
{
    private readonly AgentRuntime _runtime;
    private readonly ObservableCollection<LogEntry> _logEntries = new();
    private readonly ObservableCollection<ActionHistoryItem> _actionHistory = new();
    private System.Windows.Forms.NotifyIcon? _trayIcon;
    private bool _isExiting;

    public MainWindow()
    {
        InitializeComponent();
        LogList.ItemsSource = _logEntries;
        ActionList.ItemsSource = _actionHistory;
        HostnameText.Text = Environment.MachineName;

        var baseUrl = Environment.GetEnvironmentVariable("AGENT_API_BASE_URL") ?? "https://hostweb-3s86.onrender.com/";
        var intervalSeconds = int.TryParse(Environment.GetEnvironmentVariable("AGENT_REPORT_INTERVAL_SECONDS"), out var seconds)
            ? seconds
            : 10;
        var commandPollSeconds = int.TryParse(Environment.GetEnvironmentVariable("AGENT_COMMAND_POLL_SECONDS"), out var commandSeconds)
            ? commandSeconds
            : 1;

        _runtime = new AgentRuntime(baseUrl, intervalSeconds, commandPollSeconds);
        _runtime.LogRaised += (_, e) => Dispatcher.BeginInvoke(() => AppendLog(e.Message, e.Severity));
        _runtime.EnrollmentRequired += (_, _) => Dispatcher.BeginInvoke(ShowEnrollmentCard);
        _runtime.EnrollmentSucceeded += (_, _) => Dispatcher.BeginInvoke(HideEnrollmentCard);
        _runtime.ConnectionStatusChanged += (_, healthy) => Dispatcher.BeginInvoke(() => SetStatus(healthy));
        _runtime.ActionRecorded += (_, entry) => Dispatcher.BeginInvoke(() => AppendAction(entry));

        foreach (var entry in _runtime.LoadHistory())
        {
            _actionHistory.Add(new ActionHistoryItem(entry));
        }
        UpdateNoActionsVisibility();

        SetupTrayIcon();
        _ = _runtime.StartAsync();
    }

    private void AppendAction(ActionHistoryEntry entry)
    {
        _actionHistory.Add(new ActionHistoryItem(entry));
        UpdateNoActionsVisibility();
    }

    private void UpdateNoActionsVisibility()
    {
        NoActionsText.Visibility = _actionHistory.Count == 0 ? Visibility.Visible : Visibility.Collapsed;
    }

    private void AppendLog(string message, LogSeverity severity)
    {
        _logEntries.Add(new LogEntry(message, severity));
        if (_logEntries.Count > 300)
        {
            _logEntries.RemoveAt(0);
        }
        Dispatcher.BeginInvoke(() => LogScroll.ScrollToEnd(), DispatcherPriority.Background);
    }

    private void ShowEnrollmentCard()
    {
        //re-enrollment means this device was unenrolled, clear the on screen history now rather than
        //leaving previous owner actions visible until the app happens to restart
        _actionHistory.Clear();
        UpdateNoActionsVisibility();

        EnrollmentCard.Visibility = Visibility.Visible;
        CodeInput.Focus();
        SetStatus(null, "Waiting for enrollment code");
    }

    private void HideEnrollmentCard()
    {
        EnrollmentCard.Visibility = Visibility.Collapsed;
        EnrollmentError.Visibility = Visibility.Collapsed;
        CodeInput.Text = string.Empty;
        SetStatus(true);
    }

    private void SetStatus(bool? healthy, string? label = null)
    {
        if (healthy == true)
        {
            StatusDot.Fill = (Brush)FindResource("SuccessBrush");
            StatusText.Text = label ?? "Connected";
        }
        else if (healthy == false)
        {
            StatusDot.Fill = (Brush)FindResource("ErrorBrush");
            StatusText.Text = label ?? "Connection trouble";
        }
        else
        {
            StatusDot.Fill = (Brush)FindResource("WarningBrush");
            StatusText.Text = label ?? "Working...";
        }
    }

    private async void SubmitCodeButton_Click(object sender, RoutedEventArgs e)
    {
        await SubmitCodeAsync();
    }

    private async void CodeInput_KeyDown(object sender, System.Windows.Input.KeyEventArgs e)
    {
        if (e.Key == Key.Enter)
        {
            await SubmitCodeAsync();
        }
    }

    private async Task SubmitCodeAsync()
    {
        var code = CodeInput.Text;
        SubmitCodeButton.IsEnabled = false;
        CodeInput.IsEnabled = false;
        EnrollmentError.Visibility = Visibility.Collapsed;
        try
        {
            var outcome = await _runtime.SubmitEnrollmentCodeAsync(code);
            if (!outcome.Success)
            {
                EnrollmentError.Text = outcome.ErrorMessage ?? "Could not enroll.";
                EnrollmentError.Visibility = Visibility.Visible;
            }
        }
        finally
        {
            SubmitCodeButton.IsEnabled = true;
            CodeInput.IsEnabled = true;
        }
    }

    private void ClearActionsButton_Click(object sender, RoutedEventArgs e)
    {
        if (_actionHistory.Count == 0) return;

        var result = System.Windows.MessageBox.Show(
            "Clear the recent actions list? This only affects what's shown here - it doesn't undo anything.",
            "Clear recent actions",
            System.Windows.MessageBoxButton.YesNo,
            System.Windows.MessageBoxImage.Question);

        if (result != System.Windows.MessageBoxResult.Yes) return;

        _actionHistory.Clear();
        UpdateNoActionsVisibility();
        _runtime.ClearActionHistory();
    }

    private void SetupTrayIcon()
    {
        _trayIcon = new System.Windows.Forms.NotifyIcon
        {
            Icon = System.Drawing.SystemIcons.Application,
            Visible = true,
            Text = "Remote SysAdmin Agent"
        };

        var menu = new System.Windows.Forms.ContextMenuStrip();
        menu.Items.Add("Open", null, (_, _) => RestoreFromTray());
        menu.Items.Add("Exit", null, (_, _) => ExitApplication());
        _trayIcon.ContextMenuStrip = menu;
        _trayIcon.DoubleClick += (_, _) => RestoreFromTray();
    }

    private void RestoreFromTray()
    {
        Show();
        WindowState = WindowState.Normal;
        Activate();
    }

    private void ExitApplication()
    {
        _isExiting = true;
        _trayIcon?.Dispose();
        System.Windows.Application.Current.Shutdown();
    }

    private void Window_StateChanged(object? sender, EventArgs e)
    {
        if (WindowState == WindowState.Minimized)
        {
            Hide();
        }
    }

    //closing window minimizes to tray instead of exiting so that agent keeps running background, user must
    //use "exit" option from system tray menu to stop the agent
    private void Window_Closing(object? sender, CancelEventArgs e)
    {
        if (!_isExiting)
        {
            e.Cancel = true;
            Hide();
            return;
        }

        _trayIcon?.Dispose();
    }
}
