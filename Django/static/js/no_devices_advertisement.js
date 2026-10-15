import * as load_devices from './load_devices.js';

const devicesContainer = document.getElementById("computers-container");

async function loadComputers(){
    try{
        const response = await fetch("/api/agent/computers/");
        if (!response.ok){ throw new Error("Failed to load devices."); }
        const data = await response.json();
        const computers = data.computers ?? [];

        if (computers.length === 0){
            devicesContainer.innerHTML = `
                <div class="devices-empty-state">
                    <h3>No devices yet :(</h3>

                    <p>Add your first computer to start monitoring its status and performance bro :d</p>
                    <a href="/add-device/" class="add-device-button">+ Add Your First Device</a>
                </div>
            `;
        }
        else{
            // call devices function
            const loadingDeviceAdvertisement = document.getElementById("load-advertisement");
            loadingDeviceAdvertisement.style.display = "none";
            load_devices.LoadAvailableComputers();
        }
    } catch (error){
        console.log("Error loading devices: ", error);
        devicesContainer.innerHTML = `
            <p class="devices-error">Unable to load your devices. Please try again later.</p>
        `;
    }
}

loadComputers();

// function showMessages(){
//     const object = document.getElementById("show-no-devices");
    
//     const deviceShowcaseEmpty = (element) => {
//         return element.children.length === 0 && element.textContent.trim() === '';
//     };
    
//     if (device){}
// }