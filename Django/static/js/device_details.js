// RETRIEVEN THE DATA OF THE COMPUTERS FROM THE DATABASE INTO JSON VARIABLE
// COMMAND BUTTONS (terminate a process / start, stop, restart a service)
// import * as TableSorting from './table_sorting.js';

let currentProcesses = [];
let processSortOrder = "memory-desc";

let currentServices = []
let serviceSortOrder = "name-asc";

/* >> To Sort 'Processes' */
function renderProcesses(){
    const processTable = document.getElementById("processes-table-body");
    if(!processTable){ return; }
    const sortedProcesses = [...currentProcesses];
    sortedProcesses.sort((a, b) => {
        switch(processSortOrder){
            case "memory-asc":
                return (Number(a.MemoryMb) || 0) - (Number(b.MemoryMb) || 0);
            case "memory-desc":
                return (Number(b.MemoryMb) || 0) - (Number(a.MemoryMb) || 0);

            case "name-asc":
                return (a.Name ?? "").localeCompare(b.Name ?? "");
            case "name-desc":
                return (b.Name ?? "").localeCompare(a.Name ?? "");
            
            case "pid-asc":
                return (Number(a.Pid) || 0) - (Number(b.Pid) || 0);
            case "pid-desc":
                return (Number(b.Pid) || 0) - (Number(a.Pid) || 0);

            default:
                return 0;
        }
    });
    processTable.innerHTML = "";
    sortedProcesses.forEach(process => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${process.Pid ?? "N/A"}</td>
            <td>${process.Name ?? "Unknown"}</td>
            <td>${process.MemoryMb ?? "N/A"} MB</td>
            <td><button class="container-buttons-main btn rounded-pill px-3 btn-sm" data-pid="${process.Pid}">Terminate</button></td>
        `;
        processTable.appendChild(row);
    });
}

// >> To Sort 'Services'
function renderServices(){
    const serviceTable = document.getElementById("services-table-body");
    if(!serviceTable){ return; }
    const sortedServies = [...currentServices];
    sortedServies.sort((a, b) => {
        switch(serviceSortOrder){
            case "name-asc":
                return (a.Name ?? "").localeCompare(b.Name ?? "");
            case "name-desc":
                return (b.Name ?? "").localeCompare(a.Name ?? "");
            case "display-asc":
                return (a.DisplayName ?? "").localeCompare(b.DisplayName ?? "");
            case "display-desc":
                return (b.DisplayName ?? "").localeCompare(a.DisplayName ?? "");
            case "status-run":
                return (a.Status.toLowerCase() === "running" ? 0 : 1) - (b.Status.toLowerCase() === "running" ? 0 : 1);
            case "status-stop":
                return (a.Status.toLowerCase() === "running" ? 0 : 1) - (b.Status.toLowerCase() === "running" ? 0 : 1);
            default:
                return 0;
        }
    });
    serviceTable.innerHTML = "";
    sortedServies.forEach(service => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${service.Name ?? "Unknown"}</td>
            <td>${service.DisplayName ?? "Unknown"}</td>
            <td>${service.Status ?? "Unknown"}</td>
            <td>
                <div class="service-actions">
                    <button type="button" class="button-services start-device" data-command="start_service" data-service="${escapeAttr(service.Name)}" title="Start service"><img src="/static/images/play.png" class="button-services-icon" aria-hidden="true"><span>Start<span></button>
                    <button type="button" class="button-services stop-service" data-command="stop_service" data-service="${escapeAttr(service.Name)}" title="Stop service"><img src="/static/images/stop.png" class="button-services-icon" aria-hidden="true"><span>Stop</span></button>
                    <button type="button" class="button-services restart-service" data-command="restart_service" data-service="${escapeAttr(service.Name)}" title="Restart service"><img src="/static/images/restart.png" class="button-services-icon" aria-hidden="true"><span>Restart</span></button>
                </div>
            </td>
        `;
        //
        serviceTable.appendChild(row);
    });
}

function getCookie(name){
    const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : null;
}
function escapeAttr(value){ return String(value ?? "").replace(/&/g, "&amp;").replace(/"/g, "&quot;"); }

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

/* FUNCTION TO CHANGE PROGRESS BAR COLOR */
function updateProgressBar(barId, value){
    const bar = document.getElementById(barId);
    if(!bar){ return; }
    value = Number(value) || 0;
    value = Math.max(0, Math.min(value, 100));
    bar.style.width = `${value}%`;
    if(value<50){
        bar.style.background = "#4ade80";
        bar.style.boxShadow = "0 0 10px #4ade80";
    }
    else if (value < 80){
        bar.style.background = "#facc15";
        bar.style.boxShadow = "0 0 10px #facc15";
    }
    else{
        bar.style.background = "#f87171";
        bar.style.boxShadow = "0 0 10px #f87171";
    }
}

// Live refresh added, refetches and renders device on an interval so that CPU, memory
// and the process list update on their own without a manual reload
let isLoadingDeviceDetails = false;
const processSortDropdown = document.getElementById("process-sort");

if(processSortDropdown){
    processSortDropdown.addEventListener("change", () => {
        processSortOrder = processSortDropdown.value;
        renderProcesses();
    });
}

const serviceSortDropdown = document.getElementById("services-sort");
if(serviceSortDropdown){
    serviceSortDropdown.addEventListener("change", () => {
        serviceSortOrder = serviceSortDropdown.value;
        renderServices();
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
        
        //console tests FOR JSONS AND DATA 
        console.log("Computer data:", data);
        console.log("Hostname:", data.hostname);
        console.log("Report:", data.report);
        console.log("Heartbeat:", data.heartbeat);
        console.log("Performance:", data.performance);
        console.log("Processes:", data.processes);
        console.log("Services:", data.services);
        
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
        // from 'drives'
        document.getElementById("cpu-usage").textContent = `${cpUsage ?? 0}%`;
        // for the progress bar (do not delete)
        document.getElementById("cpu-progress").style.width = `${cpUsage ?? 0}%`;

        document.getElementById("memory-used").textContent = memoryUsed != null ? `${memoryUsed} GB (used)` : "N/A";
        // for the progress bar (do not delete)
        document.getElementById("memory-available").textContent = memoryAvailable != null ? `| ${memoryAvailable} GB (available)` : "N/A";
        
        document.getElementById("memory-percent").textContent = `${memoryUsagePercentage ?? 0}%`;
        document.getElementById("memory-progress").style.width = `${memoryUsagePercentage ?? 0}%`;
        document.getElementById("disk-usage").textContent = `${diskUsage ?? 0}%`;
        document.getElementById("disk-progress").style.width = `${diskUsage ?? 0}%`
        updateProgressBar("cpu-progress", cpUsage);
        updateProgressBar("memory-progress", memoryUsagePercentage);
        updateProgressBar("disk-progress", diskUsage);

        // PROCESSES (Updated with Sort)
        currentProcesses = processes;
        renderProcesses();
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
        renderServices();
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