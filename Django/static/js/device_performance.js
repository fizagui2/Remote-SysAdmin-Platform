// >> DEVICES PERFORMANCE
const PERFORMANCE_REFRESH_INTERVAL = 10000;
const OFFLINE_THRESHOLD_MS = 2 * 60 * 1000;

let loadingPerformances = false;

// >> HELPER FUNCTIONS
function escapeHTML(value){
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&":"&amp;",
        "<":"&lt;",
        ">":"&gt;",
        '"':"&quot;",
        "'":"&#39;"
    })[char]);
}

// FORMAT PERCENTAGES
function formatPercentage(value){
    if(value === null || value === undefined || value === ""){ return null; }
    const number = Number(value);
    if(!Number.isFinite(number)){ return null; }
    return Math.min(100, Math.max(0, number));
}

// >> CIRCULAR GRAPHS
function CreateCircleGraph(label, value, color, details = "") {
    const percent = formatPercentage(value);
    const displayedValue = percent === null ? "N/A" : `${percent.toFixed(1)}%`;
    const progress = percent ?? 0;
    
    return `
        <div class="performance-metric">
            <div class="performance-circle" style=" --progress: ${progress}%; --circle-color: ${color};">
                <span class="circle-value">${displayedValue}</span>
            </div>
            <h3>${escapeHTML(label)}</h3>
            <p>${escapeHTML(details)}</p>
        </div>
    `;
}


// >> STORAGE DRIVES
function CreateDriveInfo(drives) {
    if (!Array.isArray(drives) || drives.length === 0) {
        return `<p class="no-drive-info">No storage information available.</p>`;
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
                    <span>
                        ${usage === null ? "N/A" : `${usage.toFixed(1)}% used`}
                    </span>
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

// >> CREATE PERFORMANCE CARD
function CreatePerformanceCards(hostname, performance) {
    const card = document.createElement("div");
    card.className = "performance-card";
    // >> PERFORMANCE DATA
    const drives = performance?.Drives ?? [];
    const cpuUsage = performance?.CpuUsagePercent;
    const memoryUsage = performance?.MemoryUsagePercent;
    const memoryUsed = performance?.MemoryUsedGb;
    const memoryAvailable = performance?.MemoryAvailableGb;
    // >> MEMORY INFORMATION
    const hasMemoryData = memoryUsed !== null && memoryUsed !== undefined && memoryAvailable !== null && memoryAvailable !== undefined && Number.isFinite(Number(memoryUsed)) && Number.isFinite(Number(memoryAvailable));
    const memoryDetails = hasMemoryData ? `${Number(memoryUsed).toFixed(2)} / ${(Number(memoryUsed) + Number(memoryAvailable)).toFixed(2)} GB` : "Memory information unavailable";
    // >> PRIMARY DISK
    const primaryDrive = Array.isArray(drives) ? drives[0] : null;
    const diskUsage = primaryDrive?.UsagePercent;
    const diskLabel = primaryDrive?.DriveLetter ? `Disk (${primaryDrive.DriveLetter})` : "Disk";
    // >> TIMESTAMP
    const timestamp = performance?.Timestamp ?? null;
    const reportDate = timestamp ? new Date(timestamp) : null;
    const isValidDate = reportDate && !Number.isNaN(reportDate.getTime());
    const isOnline = isValidDate && (Date.now() - reportDate.getTime()) <= OFFLINE_THRESHOLD_MS && (Date.now() - reportDate.getTime()) >= 0;
    // >> DEVICE STATUS
    const status = !performance ? "Unavailable" : !isValidDate ? "Unknown" : isOnline ? "Online" : "Offline";
    const statusClass = status.toLowerCase();
    const formattedTimestamp = isValidDate ? reportDate.toLocaleString() : "Unknown";

    // >> CARD HTML
    card.innerHTML = `
        <div class="performance-card-header">
            <div>
                <h2>${escapeHTML(hostname)}</h2>
                <p class="performance-last-seen"> Last report: ${escapeHTML(formattedTimestamp)}</p>
            </div>
            <span class="device-status ${statusClass}">
                ${status}
            </span>
        </div>

        <!-- >> PERFORMANCE GRAPHS -->
        <div class="performance-metrics">
            ${CreateCircleGraph("CPU", cpuUsage, "#2788e8", "Processor usage")}
            ${CreateCircleGraph("RAM", memoryUsage, "#9b5de5", memoryDetails)}
            ${CreateCircleGraph(diskLabel, diskUsage, "#16a36a", "Storage usage")}
        </div>

        <!-- >> STORAGE INFORMATION -->
        <div class="performance-drives">
            <h3>Storage Drives</h3>
            ${CreateDriveInfo(drives)}
        </div>
    `;
    return card;
}

// >> LOAD ALL DEVICE PERFORMANCES
async function LoadDevicesPerformances() {
    const container = document.getElementById("performance-cards-container");
    if (!container || loadingPerformances) return;
    loadingPerformances = true;

    try {
        const response = await fetch("/api/agent/computers/");
        if (!response.ok) {
            throw new Error(`Computers HTTP ${response.status}`);
        }
        const data = await response.json();
        const computers = data.computers ?? [];

        // >> RETRIEVE EACH DEVICE
        const cards = await Promise.all(
            computers.map(async computer => {
                const hostname = computer.hostname ?? computer.Hostname ?? "Unknown";
                try {
                    const statusRes = await fetch(`/api/agent/status/?hostname=${encodeURIComponent(hostname)}`);
                    if (!statusRes.ok) {
                        throw new Error(`Status HTTP ${statusRes.status}`);
                    }

                    const statusData = await statusRes.json();
                    const performance = statusData?.performance?.data ?? statusData?.data?.performance?.data ?? null;

                    return CreatePerformanceCards(hostname, performance);

                } catch(error){
                    console.error(`Could not retrieve performance for ${hostname}:`, error);
                    return CreatePerformanceCards(hostname, null);
                }
            })
        );
        // >> UPDATE CARDS
        container.replaceChildren(...cards);
    } catch(error){
        console.error("Could not load device performances:", error);
    } finally {
        loadingPerformances = false;
    }
}

// >> INITIALIZE
document.addEventListener("DOMContentLoaded", () => {
    LoadDevicesPerformances();
    setInterval(LoadDevicesPerformances, PERFORMANCE_REFRESH_INTERVAL);
});
