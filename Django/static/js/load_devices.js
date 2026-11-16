import { escapeHTML } from './escape_html.js';

/* DEVICES CALL ROLL FUNCTION */
export function LoadAvailableComputers(){
    fetch("/api/agent/computers/")
    .then(response => response.json())
    .then(data => {
        const computersContainer = document.getElementById("computers-container");
        data.computers.forEach(computer => {
            console.log(computer.hostname);
            const report = computer.report;
            const card = document.createElement("div");
            
            /* Calculate device status */
            const lastSeen = new Date(computer.last_seen);
            const now = new Date();

            const secondsAgo = (now - lastSeen) / 1000;
            
            let status;

            if(secondsAgo < 60){ status = "Online"; }
            else{ status = "Offline"; }

            /* Showcase card */
            card.classList.add("device-card");
            card.innerHTML = `
                <div class="device-picture">
                    <img src="${COMPUTER_IMAGE}" alt="${escapeHTML(computer.hostname)} Device picture">
                </div>
            
                <h3>${escapeHTML(computer.hostname)}</h3>
                <div class="device-status">
                    <span class="status ${status === "Online" ? "status-online" : "status-offline"}"> ${status} </span>
                </div>

                <div class="device-info">
                    <p><strong>IP:</strong> ${escapeHTML(report.IpAddress)}</p>
                    <p><strong>OS:</strong>  ${escapeHTML(report.WindowsVersion)}</p>
                    <p><strong>CPU:</strong> ${escapeHTML(report.CpuModel)}</p>
                    <p><strong>Cores:</strong> ${escapeHTML(report.CpuCores)}</p>
                    <p><strong>RAM:</strong> ${escapeHTML(report.TotalRamGb)}</p>
                    <p><strong>LAST SEEN:</strong> ${escapeHTML(computer.last_seen)}</p>
                </div>
                
                <div class="see-device-button">
                    <button class="container-buttons-main btn rounded-pill px-3"><strong>View Computer</strong></button>
                </div>
            `;
            // The hostname stays out of the HTML string here: inside an onclick attribute it could run as code.
            card.querySelector(".see-device-button button").addEventListener("click", () => {
                window.location.href = `/device-details-${encodeURIComponent(computer.hostname)}/`;
            });
            computersContainer.appendChild(card);
        });
    })
    .catch(error => {
        console.error("Could not retrieve computers: ", error);
    });
}