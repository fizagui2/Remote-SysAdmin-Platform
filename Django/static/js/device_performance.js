// >> DEVICES PERFORMANCE
const PERFORMANCE_REFRESH_INTERVAL = 10000;
const OFFLINE_THRESOLD_MS = 2 * 60 * 1000;

let loadingPerformances = false;

// HELPER FUNCTIONS


function escapeHTML(value){
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&":"&amp;",
        "<":"&lt;",
        ">":"&gt;",
        '"':"&quot;",
        "'":"&#39;"
    })[char]);
}

function formatPercentage(value){
    if(value === null || value === undefined || value === ""){ return null; }
    const number = Number(value);
    if(!Number.isFinite(number)){ return null; }
    return Math.min(100, Math.max(0, number));
}

function CreateCircleGraph(label, value, details = ""){
    const percent = formatPercentage(value);
    const displayedValue = percent === null ? "N/A" : `${percent.toFixed(1)}%`;
    const progress = percent ?? 0;

    return `
        <div class="performance-metric">
            <div class="performance-circle" style="--progress: ${progress}">
                <span class="circle-value">${displayedValue}</span>
            </div>
        </div>
        <h3>${label}</h3>
        <p>${details}</p>
    `;
}

function CreateDriveInfo(drives){
    if(!Array.isArray(drives) || drives.length === 0){
        return `
            <p class="no-drive-info">No storage information availble</p>
        `
    }
    return drives.map(drive => {
        const letter = escapeHTML(drive.DriveLetter ?? "Unknown");
        const usage = formatPercentage(drive.UsagePercent);
        const freeSpace = drive.FreeGb;
        const progress = usage ?? 0;
        const formattedFreeSpace = freeSpace !== null && freeSpace !== undefined && Number.isFinite(Number(freeSpace)) ? `${Number(freeSpace).toFixed(2)} GB free` : "Free space unavailable";
        return `
            <div class="drive-info">
                <div class="drive-header">
                    <span>${letter}</span>
                    <span>${usage === null ? "N/A" : `${usage.toFixed(1)}% used`}</span>
                </div>
                <div class="drive-progress">
                    <div class="drive-progress-fill" style="width: ${progress}%"></div>
                </div>

                <small>
                    ${formattedFreeSpace}
                </small>
            </div>
        `;
    }).join("");
}

// >> CREATING PERFORMANCE CARDS
function CreatePerformanceCards(hostname, performance){
    const card = document.createElement("div");
    card.className = "performance-card";

    // variables (device info pues)
    const drives = performance?.Drives ?? [];
    //const timestamp = performance?.Timestamp ?? "N/A";
    const memoryUsed = performance?.MemoryUsedGb ? `${performance.MemoryUsedGb} GB` : "N/A";
    const memoryAvailable = performance?.MemoryAvailableGb ? `${performance.MemoryAvailableGb} GB` : "N/A";
    const cpuUsage = performance?.CpuUsagePercent ? `${performance.CpuUsagePercent} %` : "N/A";
    const memoryUsage = performance?.MemoryUsagePercent ? `${performance.MemoryUsagePercent}` : "N/A";

    // memory info
    const hasMemoryData = memoryUsed !== null && memoryUsed !== undefined && memoryAvailable !== null && memoryAvailable !== undefined && Number.isFinite(Number(memoryUsed)) && Number.isFinite(Number(memoryAvailable));
    const memoryDetails = hasMemoryData ? `${Number()}` : "";

    //const memoryDetails = memory_used != null && memory_available != null ? `${Number(memoryUsed).toFixed(2)} / ${(Number(memory_used) + Number(memory_available)).toFixed(2)} GB` : "Memory information unavailable";
    const primaryDrive = Array.isArray(drives) ? drives[0] : null;
    const diskUsage = primaryDrive?.UsagePercent;
    const diskLabel = primaryDrive?.DriveLetter ? `Disk (${primaryDrive.DriveLetter})` : "Disk";
    const lastSeenDate = lastSeen ? new Date(lastSeen) : null;

    const isValidDate = lastSeenDate && !Number.isNaN(lastSeenDate.getTime());
    const isOnline = isValidDate && (Date.now() - lastSeenDate.getTime()) <= OFFLINE_THRESOLD_MS;

    const status = isOnline ? "Online" : "Offline";
    const statusClass = isOnline ? "online" : "offline";

    const formattedTimestamp = isValidDate ? lastSeenDate.toLocaleString() : "Unknown";

    card.innerHTML = `
        <!-- >>> TITLE -->
        <div class="performance-card-header">
            <div>
                <h2>${escapeHTML(hostname)}</h2>
                <p class="performance-last-seen">Last seen: ${formattedTimestamp}</p>
            </div>
            <span class="device-status ${statusClass}">${status}</span>
        </div>
        
        <!-- >>> CONTENT -->
        <div class="performance-metrics">
            ${CreateCircleGraph("CPU", cpuUsagePercent, "Processor usage")}
            ${CreateCircleGraph("RAM", memoryUsagePercent)}
            ${CreateCircleGraph(diskLabel, diskUsage, "Storage usage")}
        </div>

        <div class="performance-drives">
            <h3>Storage Drives</h3>
            ${CreateDriveInfo(drives)}
        </div>
    `
    return card;
}

async function LoadDevicesPerformances(){
    const container = document.getElementById("performance-cards-container");
    
    if(!container || loadingPerformances){ return; }

    loadingPerformances = true;

    try{
        const response = await fetch("/api/agent/computers/");
        if(!response.ok){ throw new Error(`Request failed: ${response.status}`); }
        const data = await response.json();
        const computers = data.computers ?? [];
        const cards = await Promise.all(computers.map(async computer => {
            const hostname = computer.hostname ?? computer.Hostname ?? "Unknown";
            const lastSeen = computer.last_seen ?? lastSeen ?? null;
            try{
                const statusRes = await fetch(`/api/agent/status/?hostname=${encodeURIComponent(hostname)}`);
                if(!statusRes.ok){
                    throw new Error(`Status HTTP ${statusRes.status}`);
                }
                const statusData = await statusRes.json();
                const performance = statusData?.performance?.data ?? statusData?.data?.performance?.data ?? null;
                return CreatePerformanceCards(hostname, performance, lastSeen);
            }catch(error){
                console.error(`Could not retrieve performance for ${hostname}: `, error);
                return CreatePerformanceCards(hostname, null, lastSeen);
            }
        })
    );
        container.replaceChildren(...cards);
    }catch(error){
        console.error("Could not load the device performance paps: ", error);
    }finally{
        loadingPerformances = false;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    LoadDevicesPerformances();
    setInterval(LoadDevicesPerformances, REPORT_REFRESH_INTERVAL);
});

// try{
            //     const response = await fetch(`/api/agent/status/?hostname=${encodeURIComponent(hostname)}`)
            //     if(!response.ok){ throw new Error(`HTTP Error: ${response.status}`); }
            //     const data = await response.json()
            //     const computers = data.computers ?? [];
            //     const cards = await Promise.all(computers.map(async computer => {
            //         const hostname = computer.hostname ?? computer.Hostname ?? "Unknown";
            //         const lastSeen = computer.last_seen ?? computer.lastSeen ?? null;

                    
            //     }));
            //     container.replaceChildren(...cards);
            // }catch(error){
            //     console.error("Could not load device performance information: ", error);
            //     return CreatePerformanceCards(hostname, null);
            // }