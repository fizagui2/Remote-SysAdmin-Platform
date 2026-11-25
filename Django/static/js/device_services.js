// DEVICE SERVICES (TABLE)
import { ComputerNavigation } from './computer_navigation.js';
import { renderServices } from './render_services.js';

let currentServices = [];
let serviceSortOrder = "";
let isLoadingDeviceServices = false;

let latestRequest = 0;


const serviceSortDropdown = document.getElementById("service-sort");
if(serviceSortDropdown){
    serviceSortDropdown.addEventListener("change", () => {
        serviceSortOrder = serviceSortDropdown.value;
        renderServices(currentServices, serviceSortOrder);
    });
}

// >> LOAD SERVICES
async function LoadDeviceServices(hostname){
    const container = document.getElementById("services-table-body");
    if(!container){ return; }
    const requestId = ++latestRequest;
    isLoadingDeviceServices = true;

    try{
        const response = await fetch(`/api/agent/status/?hostname=${encodeURIComponent(hostname)}`)
        if(!response.ok){
            throw new Error(`Status HTTP: ${response.status}`);
        }
        const statusData = await response.json();
        const services = 
            statusData?.services?.data?.Services ??
            statusData?.Services ??
            statusData?.report?.Services ??
            statusData?.report?.data?.Services ??
            statusData?.services?.Services ??
            statusData?.data?.Services ??
            statusData?.data?.services ??
            [];
        if(requestId !== latestRequest){ return; }
        currentServices = Array.isArray(services) ? services : [];
        renderServices(currentServices, serviceSortOrder);
    }catch(error){
        if(requestId !== latestRequest){ return; }
        console.error(`Could not load services for ${hostname}: `, error);
        currentServices = [];
        container.innerHTML = `<tr><td colspan="4">Unable to retrieve services for this computer.</td></tr>`;
    }finally{
        if(requestId === latestRequest){ isLoadingDeviceServices = false; }
    }
}


document.addEventListener("DOMContentLoaded", () => {
    ComputerNavigation.initialize(async (hostname) => {
        await LoadDeviceServices(hostname);
    });
});