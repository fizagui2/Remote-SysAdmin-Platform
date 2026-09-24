using System.Diagnostics;
using System.ServiceProcess;
using WindowsAgent.Models;

namespace WindowsAgent.Services;

//executes commands queued by Django (Features 5 and 7) and reports what happened
//service start/stop/restart needs the agent to be running elevated
//if it isn't, these throw and get reported back as a failed result rather than crashing the agent
public class CommandService
{
    public CommandResult Execute(AgentCommand command)
    {
        try
        {
            return command.Command switch
            {
                "terminate_process" => TerminateProcess(command),
                "start_service" => ControlService(command, s => s.Start(), ServiceControllerStatus.Running),
                "stop_service" => ControlService(command, s => s.Stop(), ServiceControllerStatus.Stopped),
                "restart_service" => RestartService(command),
                _ => Failed(command, $"Unknown command '{command.Command}'.")
            };
        }
        catch (Exception ex)
        {
            return Failed(command, ex.Message);
        }
    }

    //only ever allowed to target a process that still has a visible window which is the
    //same rule ProcessService uses to decide what counts as an "app" in the first
    //place, so this can never be used to kill a background/system process
    private static CommandResult TerminateProcess(AgentCommand command)
    {
        if (command.Pid is not int pid)
            return Failed(command, "No Pid provided.");

        Process process;
        try
        {
            process = Process.GetProcessById(pid);
        }
        catch (ArgumentException)
        {
            return Failed(command, $"Process {pid} is not running.");
        }

        using (process)
        {
            if (string.IsNullOrEmpty(process.MainWindowTitle))
                return Failed(command, $"Process {pid} is not a recognized app window and cannot be terminated remotely.");

            process.Kill();
            return Succeeded(command, $"Process {pid} terminated successfully.");
        }
    }

    private static CommandResult ControlService(AgentCommand command, Action<ServiceController> action, ServiceControllerStatus expectedStatus)
    {
        if (string.IsNullOrEmpty(command.ServiceName))
            return Failed(command, "No ServiceName provided.");

        using var service = new ServiceController(command.ServiceName);
        action(service);
        service.WaitForStatus(expectedStatus, TimeSpan.FromSeconds(15));
        return Succeeded(command, $"Service '{command.ServiceName}' is now {expectedStatus}.");
    }

    private static CommandResult RestartService(AgentCommand command)
    {
        if (string.IsNullOrEmpty(command.ServiceName))
            return Failed(command, "No ServiceName provided.");

        using var service = new ServiceController(command.ServiceName);
        if (service.Status != ServiceControllerStatus.Stopped)
        {
            service.Stop();
            service.WaitForStatus(ServiceControllerStatus.Stopped, TimeSpan.FromSeconds(15));
        }
        service.Start();
        service.WaitForStatus(ServiceControllerStatus.Running, TimeSpan.FromSeconds(15));
        return Succeeded(command, $"Service '{command.ServiceName}' restarted successfully.");
    }

    private static CommandResult Succeeded(AgentCommand command, string message) =>
        new() { CommandId = command.CommandId, Status = "success", Message = message };

    private static CommandResult Failed(AgentCommand command, string message) =>
        new() { CommandId = command.CommandId, Status = "failed", Message = message };
}
