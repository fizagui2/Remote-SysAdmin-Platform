// nose Frank's function
function escapeAttr(value){ 
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g), "&gt;"; 
}

// >> TO SORT 'SERVICES' TABLE
export function renderServices(currentServices, serviceSortOrder){
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
                return Number((a.Status.toLowerCase() === "running") - (b.Status.toLowerCase() === "running"));
            case "status-stop":
                return Number((a.Status.toLowerCase() === "running") - (b.Status.toLowerCase() === "running"));
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
                    <button type="button" class="button-services start-device" data-command="start_service" data-service="${escapeAttr(service.Name)}" title="Start service"><img src="/static/images/play.png" class="button-services-icon" aria-hidden="true"><span>Start</span></button>
                    <button type="button" class="button-services stop-service" data-command="stop_service" data-service="${escapeAttr(service.Name)}" title="Stop service"><img src="/static/images/stop.png" class="button-services-icon" aria-hidden="true"><span>Stop</span></button>
                    <button type="button" class="button-services restart-service" data-command="restart_service" data-service="${escapeAttr(service.Name)}" title="Restart service"><img src="/static/images/restart.png" class="button-services-icon" aria-hidden="true"><span>Restart</span></button>
                </div>
            </td>
        `;
        serviceTable.appendChild(row);
    });
}