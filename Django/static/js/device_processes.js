import { ComputerNavigation } from './computer_navigation.js';
import { renderProcesses } from './render_processes.js';
import { escapeHTML } from './escape_html.js';
// >> DEVICE PROCESSES (TABLE)
let currentProcesses = [];
let processSortOrder = "";
let isLoadingDeviceProcesses = false;

const PROCESSES_REFRESH_INTERVAL = 10000;
const OFFLINE_THRESOLD_MS = 2 * 60 * 1000;

let latestRequest = 0;

// >>> SELECTING SORTING METHOD
const processSortDropdown = document.getElementById("process-sort");
if(processSortDropdown){
    processSortDropdown.addEventListener("change", () => {
        processSortOrder = processSortDropdown.value;
        renderProcesses(currentProcesses, processSortOrder)
    })
}

// >> LOAD PROCESSES
async function LoadDeviceProcesses(hostname){
    const container = document.getElementById("processes-card-container");

    if(!container){ return; }
    const requestId = ++latestRequest;
    isLoadingDeviceProcesses = true;
    container.innerHTML = "<p>Loading processes...</p>";

    try{
        //const response = await fetch("/api/agent/computers/");
        const response = await fetch(`/api/agent/status/?hostname=${encodeURIComponent(hostname)}`);
        if(!response.ok){
            throw new Error(`Status HTTP: ${response.status}`);
        }

        const statusData = await response.json();
        // getting the API response values
        const processes = 
            statusData?.report?.processes ??
            statusData?.processes ??
            statusData?.data?.processes ??
            [];

        // Ignore outdated response
        if(requestId !== latestRequest){ return; }
        // const data = await response.json();
        // const computers = data.computers ?? [];
        // >> RETRIEVE EACH DEVICE
        currentProcesses = Array.isArray(processes) ? processes : [];
        renderProcesses(currentProcesses, processSortOrder);
        
        // const cards = await Promise.all(
        //     computers.map(async computer => {
        //         const hostname = computer.hostname ?? computer.Hostname ?? "Unknown";
        //         try{
        //             const statusRes = await fetch(`/api/agent/status/?hostname=${encodeURIComponent(hostname)}`);
        //             if(!statusRes.ok){
        //                 throw new Error(`Status HTTP ${statusRes.status}`);
        //             }
        //             const statusData = await statusRes.json();
                    
        //         }catch(error){}
        //     })  
        // );
        // fetch(`/api/agent/status/?hostname=${encodeURIComponent(COMPUTER_HOSTNAME)}`)
        // .then()
    }catch(error){
        if(requestId !== latestRequest){ return; }
        console.error(`Could not load processes for ${hostname}: `, error);
        currentProcesses = [];
        container.innerHTML = "<p>Unable to retrieve processes for this computer.</p>";
    } finally{
        if(requestId === latestRequest){ isLoadingDeviceProcesses = false; }
    }
}


document.addEventListener("DOMContentLoaded", () => {
    // DeviceNavigation.ComputerNavigation.initialize(async (hostname) => {
    //     await LoadProcesses(hostname);
    // });
    ComputerNavigation.initialize(async (hostname) => {
        await LoadDeviceProcesses(hostname)
    });
});