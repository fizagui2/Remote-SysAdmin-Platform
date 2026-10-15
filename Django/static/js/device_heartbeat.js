// >> DEVICE HEARTBEAT
function loadDevicesHeartbeat(){
    fetch("/api/agent/computers/")
    .then(response => response.json())
    .then(data => {
        console.log(data);
        data.computers.forEach(computer => {
            const card = document.createElement("div");
            const computer_names = computer.hostname;
            
        });
        // document.getElementById
    });
}
