import * as DeviceNavigation from './computer_navigation.js';
// >> DEVICE PROCESSES (TABLE)
// const PROCESSES_REFRESH_INTERVAL = 10000;
// const OFFLINE_THRESOLD_MS = 2 * 60 * 1000;

// let loadingProcesses = false;

function CreateProcessesCard(hostname){
    
}

document.addEventListener("DOMContentLoaded", () => {
    DeviceNavigation.ComputerNavigation.initialize(async (hostname) => {
        await LoadProcesses(hostname);
    });
});