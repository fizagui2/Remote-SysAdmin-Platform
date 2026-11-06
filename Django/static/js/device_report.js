// >> DEVICE REPORT
const REPORT_REFRESH_INTERVAL = 10000;
const OFFLINE_THRESOLD_MS = 2 * 60 * 1000;

let loadingReports = false;

function createReportsCards(hostname, report){
    // creating the stupid individual card
    const card = document.createElement("div");
    // creating the stupid features variables :v
    const logInUser = report?.LoggedInUser ?? "Unknown";
    const cpuCores = report?.CpuCores ?? "N/A";
    const cpuModel = report?.CpuModel ?? "N/A";
    const ipAddress = report?.IpAddress ?? "Unknown";
    const macAddress = report?.MacAddress ?? "Unknown";
    const totalRamGB = report?.TotalRamGb ? `${report.TotalRamGb} GB` : "N/A";
    const uptimeHous = report?.UptimeHours ?? "N/A";
    const netAdapter = report?.NetworkAdapter ?? "N/A";
    const winVersion = report?.WindowsVersion ?? "Unknown";
    //card devices-report-card mb-3
    card.className = "individual-report-card";
    card.innerHTML = `
        <div class="device-report-options">
            <img src="/images/online.png" alt="online" class="hide-bro">
            <img src="/images/offline.png" alt="offline" class="">
            <img src="/images/unselected-item.png" alt="select item" class="select-item-icon">
            <img src="/images/selected-item.png" alt="" class="hide-bro">
        </div>
        <div class="report-header-card">
            <h4 class="card-title">${hostname}</h4>
            <p class="card-text"><strong>Status</strong> ${report ? 'Active' : 'No report data'}</p>
        </div>

        <div class="report-info-card">
            <span class=""></span>
            <strong id="logged-in-user"></strong>
        </div>
    `;
    // <div class=""></div>

    return card;
}

async function LoadDevicesReports(){
    const container = document.getElementById("reports-card");
    if(!container || loadingReports){ return; }

    loadingReports = true;

    try {
        const response = await fetch("/api/agent/computers/");
        if(!response.ok){
            throw new Error(`Request failed bro: ${response.status}`);
        }
        const data = await response.json();
        const computers = data.computers ?? [];
        
        const cards = await Promise.all(computers.map(async computer => {
                const hostname = computer.hostname ?? computer.Hostname ?? "Unknown";
                if(!computer.last_seen || !computer.lastSeen){ return createReportsCards(hostname, null); }
                try{
                    const statusRes = await fetch(`/api/agent/status/?hostname=${encodeURIComponent(hostname)}`);
                    if(!statusRes.ok){ throw new Error(`Status HTTP ${statusRes.status}`); }
                    const statusData = await statusRes.json();
                    const report = statusData?.report?.data ?? null;
                    //const report = data.report.data;
                    return createReportsCards(hostname, report);
                }catch(error){
                    console.error("Could not retrieve computer information: ", error);
                    return createReportsCards(hostname, null);
                }
            })
        );
        container.innerHTML = "";
        cards.forEach((card) => {
            if(card) { container.appendChild(card); }
        });
    }catch(error){
        console.error("Could not load the device report papu: ", error);
    }finally{
        loadingReports = false;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    LoadDevicesReports();
    setInterval(LoadDevicesReports, REPORT_REFRESH_INTERVAL);
});

// if(computer.last_seen || computer.lastSeen){
//     fetch(`/api/agent/status/?hostname=${encodeURIComponent(hostname)}`)
//     .then(result => {
//         if(!result.ok){
//             throw new Error();
//         }
//         return result.json();
//     })
//     .then(data => {
//         const report = data.report.data;
//         console.log("Report (ALL COMPUTERS): ", report);
        
//         // document.getElementById("").textContent = `${hostname}`;

//     })
//     .finally(() => {
//     });
//     return createReportsCards(hostname, report);
// }

// .then(response => response.json())
    // .then(data => {
    //     console.log(data);
    //     document.getElementById("hostname").textContent = data.report.data.Hostname;
    //     document.getElementById("ip-address").textContent = data.report.data.IpAddress;
    //     document.getElementById("mac-address").textContent = data.report.data.MacAddress;
    //     document.getElementById("total-ram").textContent = data.report.data.TotalRamGb;
    //     document.getElementById("logged-in-user").textContent = data.report.data.LoggedInUser;
    //     document.getElementById("network-adapter").textContent = data.report.data.NetworkAdapter;
    //     document.getElementById("cpu-cores").textContent = data.report.data.CpuCores;
    //     document.getElementById("cpu-model").textContent = data.report.data.CpuModel;
    //     document.getElementById("cpu-usage").textContent = `${data.performance.data.CpuUsagePercent}%`;
    //     document.getElementById("memory-usage").textContent = `${data.performance.data.MemoryUsagePercent}%`;
    //     document.getElementById("heartbeat-status").textContent = data.heartbeat.has_data ? "Online" : "Offline";
    // })
    // .catch(error => {
    //     console.error("Could not retrieve agent status:", error);
    // });