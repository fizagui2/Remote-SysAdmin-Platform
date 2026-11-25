import { escapeHTML } from './escape_html.js';

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
            <td>${escapeHTML(service.Name ?? "Unknown")}</td>
            <td>${escapeHTML(service.DisplayName ?? "Unknown")}</td>
            <td>${escapeHTML(service.Status ?? "Unknown")}</td>
            <td>
                <div class="service-actions">
                    <button type="button" class="start-service banner-button banner-button-secondary bolded" data-command="start_service" data-service="${escapeHTML(service.Name)}" title="Start service"><img src="/static/images/play.png" class="button-services-icon" aria-hidden="true"><span>Start</span></button>
                    <button type="button" class="stop-service banner-button banner-button-secondary bolded" data-command="stop_service" data-service="${escapeHTML(service.Name)}" title="Stop service"><img src="/static/images/stop.png" class="button-services-icon" aria-hidden="true"><span>Stop</span></button>
                    <button type="button" class="restart-service banner-button banner-button-secondary bolded" data-command="restart_service" data-service="${escapeHTML(service.Name)}" title="Restart service"><img src="/static/images/restart.png" class="button-services-icon" aria-hidden="true"><span>Restart</span></button>
                </div>
            </td>
        `;
        serviceTable.appendChild(row);
    });
}