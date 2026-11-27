// RETRIEVEN THE DATA OF THE COMPUTERS FROM THE DATABASE INTO JSON VARIABLE
// COMMAND BUTTONS (terminate a process / start, stop, restart a service)
// import * as TableSorting from './table_sorting.js';
import { updateProgressBar } from './progress_bar.js';
import { renderProcesses } from './render_processes.js';
import { renderServices } from './render_services.js';

const COMPUTER_HOSTNAME = window.COMPUTER_HOSTNAME;

let currentProcesses = [];
let processSortOrder = "memory-desc";

let currentServices = []
let serviceSortOrder = "name-asc";


function getCookie(name){
    const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : null;
}
//function escapeAttr(value){ return String(value ?? "").replace(/&/g, "&amp;").replace(/"/g, "&quot;"); }

function queueCommand(command, extra, buttonEl){
    const originalText = buttonEl.textContent;
    buttonEl.disabled = true;
    buttonEl.textContent = "Queuing...";
    const body = new URLSearchParams({ hostname: COMPUTER_HOSTNAME, command, ...extra });

    fetch("/debug/queue-command/", {
        method: "POST",
        headers: {
            "X-CSRFToken": getCookie("csrftoken"),
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
    })
        .then(response => {
            if(!response.ok){ throw new Error(`Request failed (${response.status})`); }
            buttonEl.textContent = "Queued";
        })
        .catch(error => {
            console.error("Could not queue command: ", error);
            buttonEl.textContent = "Failed";
        })
        .finally(() => {
            setTimeout(() => {
                buttonEl.disabled = false;
                buttonEl.textContent = originalText;
            }, 2000);
        });
}

// Live refresh added, refetches and renders device on an interval so that CPU, memory
// and the process list update on their own without a manual reload
let isLoadingDeviceDetails = false;
const processSortDropdown = document.getElementById("process-sort");

if(processSortDropdown){
    processSortDropdown.addEventListener("change", () => {
        processSortOrder = processSortDropdown.value;
        renderProcesses(currentProcesses, processSortOrder);
    });
}

const serviceSortDropdown = document.getElementById("services-sort");
if(serviceSortDropdown){
    serviceSortDropdown.addEventListener("change", () => {
        serviceSortOrder = serviceSortDropdown.value;
        renderServices(currentServices, serviceSortOrder);
    });
}

function loadDeviceDetails(){
    if(isLoadingDeviceDetails){ return; }
    isLoadingDeviceDetails = true;

    fetch(`/api/agent/status/?hostname=${encodeURIComponent(COMPUTER_HOSTNAME)}`)
    .then(response => {
        if(!response.ok){
            throw new Error("Could not retrieve computer data.");
        }
        return response.json();
    })
    .then(data => {
        // variables
        const report = data.report.data;
        const heartbeat = data.heartbeat.data;
        const performance = data.performance.data;

        const cpUsage = performance.CpuUsagePercent;
        const memoryUsed = performance.MemoryUsedGb;
        const memoryAvailable = performance.MemoryAvailableGb;
        const memoryUsagePercentage = performance.MemoryUsagePercent;
        const diskUsage = performance.Drives?.[0]?.UsagePercent;

        const processes = data.processes.data?.Processes || [];
        const services = data.services.data?.Services || [];
        
        // >> DEVICE INFORMATION (showing data in html element basis on their id's)
        // REPORT (completed)
        document.getElementById("hostname").textContent = `💻 ${data.hostname} 💻`;
        document.getElementById("net-adapter").textContent = report.NetworkAdapter ?? "N/A";
        document.getElementById("ip-address").textContent = report.IpAddress ?? "N/A";
        document.getElementById("mac-address").textContent = report.MacAddress ?? "N/A";
        document.getElementById("win-version").textContent = report.WindowsVersion ?? "N/A";
        document.getElementById("cpu-cores").textContent = report.CpuCores ?? "N/A";
        document.getElementById("cpu-model").textContent = report.CpuModel ?? "N/A";
        document.getElementById("total-ram").textContent = report.TotalRamGb != null ? `${report.TotalRamGb} GB` : "N/A";
        document.getElementById("uptime-hours").textContent = report.UptimeHours ?? "N/A";
        document.getElementById("logged-in-user").textContent = report.LoggedInUser ?? "Undentified user";
        // need to show in bar table or circle table
        document.getElementById("drives").textContent = report.Drives?.length ? report.Drives.map(drive => `${drive.DriveLetter} - ${drive.FreeGb} GB free / ${drive.TotalGb} GB`).join(", ") : "N/A"; // ?? "N/A";
        
        // HEARTBEAT
        document.getElementById("heartbeat-timestamp").textContent = heartbeat.Timestamp;
        
        // PERFORMANCE
        // from 'drives' (CPU)
        document.getElementById("cpu-usage").textContent = `${cpUsage ?? 0}%`;
        // for the progress bar (do not delete)
        //document.getElementById("cpu-progress").style.width = `${cpUsage ?? 0}%`;

        document.getElementById("memory-used").textContent = memoryUsed != null ? `${memoryUsed} GB (used)` : "N/A";
        // for the progress bar (do not delete)
        document.getElementById("memory-available").textContent = memoryAvailable != null ? `| ${memoryAvailable} GB (available)` : "N/A";
        
        document.getElementById("memory-percent").textContent = `${memoryUsagePercentage ?? 0}%`;
        //document.getElementById("memory-progress").style.width = `${memoryUsagePercentage ?? 0}%`;
        document.getElementById("disk-usage").textContent = `${diskUsage ?? 0}%`;
        //document.getElementById("disk-progress").style.width = `${diskUsage ?? 0}%`
        updateProgressBar("cpu-progress", cpUsage);
        updateProgressBar("memory-progress", memoryUsagePercentage);
        updateProgressBar("disk-progress", diskUsage);

        // PROCESSES (Updated with Sort)
        currentProcesses = processes;
        renderProcesses(currentProcesses, processSortOrder);
        const processTable = document.getElementById("processes-table-body");
        if(processTable){
            processTable.onclick = (event) => {
                const button = event.target.closest("button[data-pid]");
                if(!button){ return; }
                queueCommand("terminate_process", {pid:button.dataset.pid}, button);
            };
        }
        
        // SERVICES (Updated with Sort)
        currentServices = services;
        renderServices(currentServices, serviceSortOrder);
        const serviceTable = document.getElementById("services-table-body");
        if (serviceTable){
            serviceTable.onclick = (event) => {
                const button = event.target.closest("button[data-command]");
                if(!button){ return; }
                queueCommand(button.dataset.command, {service_name: button.dataset.service }, button);
            };
        }
    })
    .catch(error => {
        console.error("Could not retrieve computer information: ", error);
    })
    .finally(() => {
        isLoadingDeviceDetails = false;
    });
}

loadDeviceDetails();
setInterval(loadDeviceDetails, 1000);