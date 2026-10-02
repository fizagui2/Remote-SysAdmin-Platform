/* DEVICES CALL ROLL FUNCTION*/
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
                <img src="${COMPUTER_IMAGE}" alt="${computer.hostname} Device picture">
            </div>
        
            <h3>${computer.hostname}</h3>
            <div class="device-status">
                <span class="status ${status === "Online" ? "status-online" : "status-offline"}"> ${status} </span>
            </div>

            <div class="device-info">
                <p><strong>IP:</strong> ${report.IpAddress}</p>
                <p><strong>OS:</strong>  ${report.WindowsVersion}</p>
                <p><strong>CPU:</strong> ${report.CpuModel}</p>
                <p><strong>Cores:</strong> ${report.CpuCores}</p>
                <p><strong>RAM:</strong> ${report.TotalRamGb}</p>
                <p><strong>LAST SEEN:</strong> ${computer.last_seen}</p>
            </div>
            
            <div class="see-device-button">
                <button class="container-buttons-main btn rounded-pill px-3" onclick="window.location.href='/device-details-${encodeURIComponent(computer.hostname)}/'"><strong>View Computer</strong></button>
            </div>
        `;
        computersContainer.appendChild(card);
    });
})
.catch(error => {
    console.error("Could not retrieve computers: ", error);
});