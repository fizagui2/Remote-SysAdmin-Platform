// >> DEVICES PERFORMANCE
const PERFORMANCE_REFRESH_INTERVAL = 10000;
const OFFLINE_THRESOLD_MS = 2 * 60 * 1000;

let loadingPerformances = false;

function CreatePerformanceCards(hostname, performance){
    const card = document.createElement("div");
    card.className = "performance-card";

    const drives = performance?.Drives ?? "Unknown";
    const timestamp = performance?.Timestamp ?? "N/A";
    const memory_used = performance?.MemoryUsedGb ? `${performance.MemoryUsedGb} GB` : "N/A";
    const memory_available = performance?.MemoryAvailableGb ? `${performance.MemoryAvailableGb} GB` : "N/A";
    const cpuUsagePercent = performance?.CpuUsagePercent ? `${performance.CpuUsagePercent} %` : "N/A";
    const memoryUsagePercent = performance?.MemoryUsagePercent ? `${performance.MemoryUsagePercent}` : "N/A";

    card.innerHTML = `
        <!-- >>> TITLE -->
        <div class="performance-card-header">
        </div>
        
        <!-- >>>  -->
        <div class="performance-card-info">
            <div class="pci-card">
                <span class="bolded">TEST:</span>
                <p>${memory_used}</p>
            </div>
        </div>
    `
}

async function LoadDevicesPerformances(){
    const container = document.getElementById("performance-cards-container");
    
    if(!container || loadingPerformances){ return; }

    loadingPerformances = true;

    try{
        const response = await fetch("/api/agent/computers/");
        if(!response.ok){ throw new Error(`Request failed: ${response.status}`); }
        const data = await response.json;
        const computers = data.computers ?? [];

        const cards = await Promise.all(computers.map(async computer => {
            const hostname = computer.hostname ?? computer.Hostname ?? "Unknown";
            if(!computer.last_seen || !computer.lastSeen){ return CreatePerformanceCards(hostname, null); }
            try{
                const statusRes = await fetch(`/api/agent/status/?hostname=${encodeURIComponent(hostname)}`)
                if(!statusRes.ok){ throw new Error(`Status HTTP ${statusRes.status}`); }
                const statusData = await statusRes.json();
                const performance = statusData?.performance?.data ?? null;
                return CreatePerformanceCards(hostname, performance);
            }catch(error){
                console.error("Could not retrieve computer information: ", error);
                return CreatePerformanceCards(hostname, null);
            }
        })
    );
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