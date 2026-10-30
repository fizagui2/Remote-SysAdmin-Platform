// >> SORTING TABLES PROCESSES & SERVICES (nvm idk it breaks when trying to import)
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
        serviceTable.appendChild(row);
    });
}