import * as DeviceNavigation from './computer_navigation.js';
import { renderProcesses } from './render_processes.js';
// >> DEVICE PROCESSES (TABLE)
let currentProcesses = [];
let processSortOrder = "";

const PROCESSES_REFRESH_INTERVAL = 10000;
const OFFLINE_THRESOLD_MS = 2 * 60 * 1000;

// let loadingProcesses = false;
// >> HELPER FUNCTIONS
function CreateProcessesCard(hostname){
    
}

// SELECTING SORTING METHOD
const processSortDropdown = document.getElementById("process-sort");
if(processSortDropdown){
    processSortDropdown.addEventListener("change", () => {
        processSortOrder = processSortDropdown.value;
        renderProcesses(currentProcesses, processSortOrder)
    })
}
document.addEventListener("DOMContentLoaded", () => {
    DeviceNavigation.ComputerNavigation.initialize(async (hostname) => {
        await LoadProcesses(hostname);
    });
});