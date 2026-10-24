// >> DEVICE HEARTBEAT
const HEARBEAT_REFRESH_INTERVAL = 10000;
// for Agent heartbeat frecuency
const OFFLINE_THRESOLD_MS = 2 * 60 * 1000;

let loadingHeartbeats = false;


/* HELPER FUNCTIONS FOR TIME (FOR TIMESTAMP) */
function formatTimestamp(timestamp){
    if(!timestamp){ return null; }
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())){ return null; }
    return date;
}
function getRelativeTime(date){
    const elapsedSeconds = Math.max(0, Math.floor(Date.now() - date.getTime()) / 1000);
    if (elapsedSeconds < 60){ return "Just now"; }
    if (elapsedSeconds < 3600){
        const minutes = Math.floor(elapsedSeconds / 60);
        return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
    }
    if (elapsedSeconds < 86400){
        const hours = Math.floor(elapsedSeconds / 3600);
        return `${hours} hour${hours === 1 ? "" : "s"} ago`;
    }
    const days = Math.floor(elapsedSeconds / 86400);
    return `${days} day${days === 1 ? "" : "s"} ago`;
}

/* HELPER FUNCTION FOR CREATING HEARTBEATS CARDS */
function createHeartbeatCard(hostname, timestamp){
    const card = document.createElement("div");
    card.className = "heartbeat-card";

    const header = document.createElement("div");
    header.className = "heartbeat-card-header";

    const name = document.createElement("h3");
    name.className = "heartbeat-hostname";
    name.textContent = `${hostname}`;

    const status = document.createElement("span");
    status.className = "heartbeat-status";

    // dont think Ima need it bro
    const details = document.createElement("p");
    details.className = "heartbeat-details";

    const dateLabel = document.createElement("p");
    dateLabel.className = "heartbeat-date";

    const relativeLabel = document.createElement("p");
    relativeLabel.className = "heartbeat-relative";

    const date = formatTimestamp(timestamp);

    if(!date){
        status.textContent = "Unknown";
        status.classList.add("status-unknown");
        dateLabel.textContent = "No valid heartbeat timestamp";
        relativeLabel.textContent = "Heartbeat information unavailable";
    } else{
        const elapsed = Date.now() - date.getTime();
        const online = elapsed >= 0 && elapsed <= OFFLINE_THRESOLD_MS;
        status.textContent = online ? "Online" : "Offline";
        status.classList.add(online ? "status-online" : "status-offline");
        header.append(name, status);
        details.append(dateLabel, relativeLabel);
        card.append(header, details);
        return card;
    }
}

async function loadDevicesHeartbeat(){
    const container = document.getElementById("hearbeats-cards");
    if(!container || loadingHeartbeats) { return; }

    loadingHeartbeats = true;

    try{
        const response = await fetch("/api/agent/computers/");
        if(!response.ok){
            throw new Error(`Request failed bro: ${response.status}`);
        }
        const data = await response.json();
        const computers = data.computers ?? [];
        const cards = await Promise.all(computers.map(async computer => {
            const hostname = computer.hostname ?? computer.Hostname ?? "Unknown";
                try{
                    if(computer.last_seen || computer.lastSeen){
                        return createHeartbeatCard(hostname, computer.lastSeen ?? computer.lastSeen);
                    }
                    const statusResponse = await fetch(`/api/agent/status/?hostname=${encodeURIComponent(hostname)}`);
                    
                    if(!statusResponse.ok){ throw new Error(`Status request failed: ${statusResponse.status}`); }
                    
                    const statusData = await statusResponse.json();
                    const heartbeat = statusData.heartbeat?.data ?? {};
                    return createHeartbeatCard(hostname, heartbeat.Timestamp ?? heartbeat.timestamp);
                }catch(error){
                    console.error(`Could not load heartbeat for ${hostname}: `, error);
                    return createHeartbeatCard(hostname, null);
                }
            })
        );
        
        container.replaceChildren();
        
        if (cards.length === 0){
            const emptyMessage = document.createElement("p");
            emptyMessage.textContent = "No devices found.";
            container.appendChild(emptyMessage);
        }else{
            container.append(...cards);
        }
    }catch(error){
        console.error("Could not load the device heartbeat: ", error);
        container.replaceChildren();
        const errorMessage = document.createElement("p");
        errorMessage.textContent = "Unable to load heartbeat information. Please try again.";
        container.appendChild(errorMessage);
    } finally{
        loadingHeartbeats = false;
    }
}

loadDevicesHeartbeat();
setInterval(loadDevicesHeartbeat, HEARBEAT_REFRESH_INTERVAL);

// const device_name = document.createElement("h2");
//         const device_info = document.createElement("div");

// if (computers.length === 0){
//             device_name.textContent = "No mames no hay :V";
//             device_info.textContent = "No devices found.";
//             divbody.appendChild(device_name);
//             divbody.appendChild(device_info);
//         }
//         computers.forEach(computer => {
//             const hostname = document.createElement("div");
//             hostname.textContent = computer.hostname ?? "Unknown";
//             const lastSeenDiv = document.createElement("div");
//             const lastSeen = computer.last_seen ? new Date(computer.last_seen) : null;

//         });

// fetch()
//     .then(response => response.json())
//     .then(data => {
//         console.log(data);
//         data.computers.forEach(computer => {
//             const card = document.createElement("div");
//             const computer_names = computer.hostname;
            
//         });
        
//     });