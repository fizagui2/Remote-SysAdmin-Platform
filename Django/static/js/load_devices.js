/* DEVICES CALL ROLL FUNCTION*/
fetch("/api/agent/computers/")
.then(response => response.json())
.then(data => {
    const computersContainer = document.getElementById("computers-container");
    data.computers.forEach(computer => {
        console.log(computer.hostname);
        const report = computer.report;
        const card = document.createElement("div");
        
        const lastSeen = new Date(computer.last_seen);
        const now = new Date();

        const secondsAgo = (now - lastSeen) / 1000;
        if(secondsAgo < 60){ status = "Online"; }
        else{ status = "Offline"; }

        card.classList.add("general-container");
        card.innerHTML = `
            <div class="device-info">
                <h3>${computer.hostname}</h3>
                <p> Online</p>
                <p><strong>IP:</strong> ${report.IpAddress}</p>
                <p><strong>OS:</strong>  ${report.WindowsVersion}</p>
                <p><strong>CPU:</strong> ${report.CpuModel}</p>
                <p><strong>Cores:</strong> ${report.CpuCores}</p>
                <p><strong>RAM:</strong> ${report.TotalRamGb}</p>
                <p><strong>LAST SEEN:</strong> ${computer.last_seen}</p>
            </div>
            
            <div class="device-picture">
                <div class="img-small"><img src="/images/computer_image.png" alt="device-picture"></div>
            </div>

            <div class="see-device-button">
                <button class="general-button btn rounded-pill px-3">View Computer</button>
            </div>
        `;
        computersContainer.appendChild(card);
    });
})
.catch(error => {

});