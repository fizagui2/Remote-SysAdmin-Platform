// skipping for now
// devices.forEach(device => {
    
// });

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
            <h3>${computer.hostname}</h3>
            <p> Online</p>
            <p>IP: ${report.IpAddress}</p>
            <p>${report.WindowsVersion}</p>
            <p>CPU: ${report.CpuModel}</p>
            <p>Cores: ${report.CpuCores}</p>
            <p>RAM: ${report.TotalRamGb}</p>
            <p>LAST SEEN: ${computer.last_seen}</p>
            <button class="view-computer">View Computer</button>
        `;
        computersContainer.appendChild(card);
    });
})
.catch(error => {

});