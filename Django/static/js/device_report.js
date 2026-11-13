// >> DEVICE REPORT
const REPORT_REFRESH_INTERVAL = 10000;
const OFFLINE_THRESOLD_MS = 2 * 60 * 1000;

let loadingReports = false;

function GetImagePaths(){
    const scriptTag = document.getElementById('image-reports-data');
    if(!scriptTag){ return { online:'', offline:'', selected:'', unselected:''}; }
    try{
        return JSON.parse(scriptTag.textContent);
    }catch(error){
        console.error("Could not parse the stupid images from the stupid script label JSON stupid variable ", error);
        return { online:'', offline:'', selected:'', unselected:''};
    }
    // const imagePaths = JSON.parse(document.getElementById('image-reports-data').textContent);
}

function CreateReportsCards(hostname, report){
    const imagePaths = GetImagePaths();
    // creating the stupid individual card
    const card = document.createElement("div");
    // creating the stupid features variables :v
    const logInUser = report?.LoggedInUser ?? "Unknown";
    const cpuCores = report?.CpuCores ?? "N/A";
    const cpuModel = report?.CpuModel ?? "N/A";
    const ipAddress = report?.IpAddress ?? "Unknown";
    const macAddress = report?.MacAddress ?? "Unknown";
    const totalRamGB = report?.TotalRamGb ? `${report.TotalRamGb} GB` : "N/A";
    const uptimeHours = report?.UptimeHours ?? "N/A";
    const netAdapter = report?.NetworkAdapter ?? "N/A";
    const winVersion = report?.WindowsVersion ?? "Unknown";
    //card devices-report-card mb-3
    card.className = "individual-report-card";
    card.innerHTML = `
        <!-- >> IMAGES FOR STATUS & ACTIONS -->
        <div class="device-report-options">
            <img src="${imagePaths.online}" alt="online" class="hide-bro image-icon">
            <img src="${imagePaths.offline}" alt="offline" class="image-icon">
            <img src="${imagePaths.selected}" alt="select item" class="hide-bro image-icon">
            <img src="${imagePaths.unselected}" alt="unselected item" class="select-item-icon image-icon">
        </div>
        <!-- >> TITLE -->
        <div class="report-header-card">
            <h4 class="card-title">${hostname}</h4>
            <p class="card-text"><strong>Status</strong> ${report ? 'Active' : 'No report data'}</p>
        </div>
        <!-- >> INFO -->
        <div class="report-ind-card-info">
            <div class="report-info-card">
                <span class="bolded">Logged In User: </span>
                <p>${logInUser}</p>
            </div>
            <div class="report-info-card">
                <span class="bolded">IP Address: </span>
                <p>${ipAddress}</p>
            </div>
            <div class="report-info-card">
                <span class="bolded">MAC Address: </span>
                <p>${macAddress}</p>
            </div>
            <div class="report-info-card">
                <span class="bolded">Network Adapter: </span>
                <p>${netAdapter}</p>
            </div>
            <div class="report-info-card">
                <span class="bolded">Total RAM: </span>
                <p>${totalRamGB}</p>
            </div>
            <div class="report-info-card">
                <span class="bolded">CPU Model: </span>
                <p>${cpuModel}</p>
            </div>
            <div class="report-info-card">
                <span class="bolded">CPU Cores: </span>
                <p>${cpuCores}</p>
            </div>
            <div class="report-info-card">
                <span class="bolded">Windows: </span>
                <p>${winVersion}</p>
            </div>
            <div class="report-info-card">
                <span class="bolded">Uptime hours: </span>
                <p>${uptimeHours}</p>
            </div>
            <!-- >> BUTTON TO SEE DEVICE DEPEER DETAILS -->
            <div class="see-device-button">
                <button class="container-buttons-main btn rounded-pill px-3" onclick="window.location.href='/device-details-${encodeURIComponent(hostname)}/'"><strong>More Details</strong></button>
            </div>
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
                if(!computer.last_seen || !computer.lastSeen){ return CreateReportsCards(hostname, null); }
                try{
                    const statusRes = await fetch(`/api/agent/status/?hostname=${encodeURIComponent(hostname)}`);
                    if(!statusRes.ok){ throw new Error(`Status HTTP ${statusRes.status}`); }
                    const statusData = await statusRes.json();
                    const report = statusData?.report?.data ?? null;
                    //const report = data.report.data;
                    return CreateReportsCards(hostname, report);
                }catch(error){
                    console.error("Could not retrieve computer information: ", error);
                    return CreateReportsCards(hostname, null);
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