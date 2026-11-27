import { escapeHTML } from './escape_html.js';

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
        <!--
        <div class="device-report-options">
            <img src="${imagePaths.online}" alt="online" class="hide-bro image-icon">
            <img src="${imagePaths.offline}" alt="offline" class="image-icon">
            <img src="${imagePaths.selected}" alt="select item" class="hide-bro image-icon">
            <img src="${imagePaths.unselected}" alt="unselected item" class="select-item-icon image-icon">
        </div>
        -->
        <!-- >> TITLE -->
        <div class="report-header-card">
           
        <h4 class="card-title">${escapeHTML(hostname)}</h4>
            <p class="report-status"><strong >Status</strong> ${report ? 'Active' : 'No report data'}</p>
        </div>
        <!-- >> INFO -->
        <div class="report-ind-card-info">
            <div class="report-info-card">
                <p><strong>Logged In User:</strong> ${escapeHTML(logInUser)}</p>
            </div>
            <div class="report-info-card">
                <p><strong>IP Address:</strong> ${escapeHTML(ipAddress)}</p>
            </div>
            <div class="report-info-card">
                <p><strong>MAC Address:</strong> ${escapeHTML(macAddress)}</p>
            </div>
            <div class="report-info-card">
                <p><strong>Network Adapter:</strong> ${escapeHTML(netAdapter)}</p>
            </div>
            <div class="report-info-card">
                <p><strong>Total RAM:</strong> ${escapeHTML(totalRamGB)}</p>
            </div>
            <div class="report-info-card">
                <p><strong>CPU Model:</strong ${escapeHTML(cpuModel)}</p>
            </div>
            <div class="report-info-card">
                <p><strong>CPU Cores:</strong> ${escapeHTML(cpuCores)}</p>
            </div>
            <div class="report-info-card">
                <p><strong>Windows version:</strong> ${escapeHTML(winVersion)}</p>
            </div>
            <div class="report-info-card">
                <p><strong>Uptime hours:</strong> ${escapeHTML(uptimeHours)}</p>
            </div>
            <!-- >> BUTTON TO SEE DEVICE DEPEER DETAILS -->
            <div class="see-device-button">
                <button class="container-buttons-main btn rounded-pill px-3"><strong>More Details</strong></button>
            </div>
        </div>
    `;
    // The hostname stays out of the HTML string here: inside an onclick attribute it could run as code.
    card.querySelector(".see-device-button button").addEventListener("click", () => {
        window.location.href = `/device-details-${encodeURIComponent(hostname)}/`;
    });
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
        const computers = Array.isArray(data.computers) ? data.computers : [];
        // const computers = data.computers ?? [];
        
        const cards = await Promise.all(computers.map(async computer => {
                //const hostname = computer.hostname ?? computer.Hostname ?? "Unknown";
                const hostname = typeof computer === "string" ? computer : computer?.hostname ?? computer?.Hostname ?? "Unknown";

                //if(!computer.last_seen || !computer.lastSeen){ return CreateReportsCards(hostname, null); }
                try{
                    const statusRes = await fetch(`/api/agent/status/?hostname=${encodeURIComponent(hostname)}`);
                    if(!statusRes.ok){ throw new Error(`Status HTTP ${statusRes.status}`); }
                    const statusData = await statusRes.json();
                    const report = statusData?.report?.has_data ? statusData.report.data : null;
                    //const report = statusData?.report?.data ?? null;
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