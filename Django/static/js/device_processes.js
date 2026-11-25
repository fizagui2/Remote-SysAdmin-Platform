import { ComputerNavigation } from './computer_navigation.js';
import { renderProcesses } from './render_processes.js';

let currentProcesses = [];
let processSortOrder = "";
let isLoadingDeviceProcesses = false;

// PRobabLy dont fokin need them
// const PROCESSES_REFRESH_INTERVAL = 10000;
// const OFFLINE_THRESOLD_MS = 2 * 60 * 1000;

let latestRequest = 0;

// >>> SELECTING SORTING METHOD
const processSortDropdown = document.getElementById("process-sort");
if(processSortDropdown){
    processSortDropdown.addEventListener("change", () => {
        processSortOrder = processSortDropdown.value;
        renderProcesses(currentProcesses, processSortOrder)
    });
}

// >> LOAD PROCESSES
async function LoadDeviceProcesses(hostname){
    const container = document.getElementById("processes-table-body");
    if(!container){ return; }
    const requestId = ++latestRequest;
    isLoadingDeviceProcesses = true;
    //container.innerHTML = `<tr><td colspan="4">Loading processes...</td></tr>`;

    try{
        const response = await fetch(`/api/agent/status/?hostname=${encodeURIComponent(hostname)}`);
        if(!response.ok){
            throw new Error(`Status HTTP: ${response.status}`);
        }
        const statusData = await response.json();
        // getting the API response values
        const processes =
            statusData?.processes?.data?.Processes ??
            statusData?.Processes ??
            statusData?.report?.Processes ??
            statusData?.report?.data?.Processes ??
            statusData?.processes?.Processes ??
            statusData?.data?.Processes ??
            statusData?.data?.processes ??
            [];
        // Ignore outdated response
        if(requestId !== latestRequest){ return; }
        // >> RETRIEVE EACH DEVICE
        currentProcesses = Array.isArray(processes) ? processes : [];
        console.log("Processes retrieved: ", currentProcesses);
        console.log("Number of processes: ", currentProcesses.length);
        renderProcesses(currentProcesses, processSortOrder);
    }catch(error){
        if(requestId !== latestRequest){ return; }
        console.error(`Could not load processes for ${hostname}: `, error);
        currentProcesses = [];
        container.innerHTML = `<tr><td colspan="4">Unable to retrieve processes for this computer.</td></tr>`;
    } finally{
        if(requestId === latestRequest){ isLoadingDeviceProcesses = false; }
    }
}


document.addEventListener("DOMContentLoaded", () => {
    ComputerNavigation.initialize(async (hostname) => {
        await LoadDeviceProcesses(hostname)
    });
});