// >> DEVICE HEARTBEAT
fetch("/api/agent/status/")
    .then(response => response.json())
    .then(data => {
        console.log(data);
        document.getElementById
    });