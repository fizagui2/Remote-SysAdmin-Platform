fetch("/api/agent/status/")
    .then(response => response.json())
    .then(data => {
        console.log(data);
        // loading data from Frank APIs
        document.getElementById("report-status").textContent = data.report.has_data ? "Data available" : "No Data";
        document.getElementById("heartbeat-status").textContent = data.heartbeat.has_data ? "Online" : "No Data";
        document.getElementById("performance-status").textContent = data.performance.has_data ? "Data available" : "No Data";
        document.getElementById("processes-status").textContent = data.processes.has_data ? "Data available" : "No Data";
    })
    .catch(error => {
        console.error("Could not retrieve agent status: ", error);
    });