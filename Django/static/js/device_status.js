// >> GENERAL DEVICE DESCRIPTION
// OLD
// fetch("/api/agent/status/")
//     .then(response => response.json())
//     .then(data => {
//         console.log(data);
//         // loading data from Frank APIs
//         document.getElementById("report-status").textContent = data.report.has_data ? "Data available" : "No Data";
//         document.getElementById("heartbeat-status").textContent = data.heartbeat.has_data ? "Online" : "No Data";
//         document.getElementById("performance-status").textContent = data.performance.has_data ? "Data available" : "No Data";
//         document.getElementById("processes-status").textContent = data.processes.has_data ? "Data available" : "No Data";
//     })
//     .catch(error => {
//         console.error("Could not retrieve agent status: ", error);
//     });


fetch("/api/agent/status/")
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log(data);

        const reportStatus = document.getElementById("report-status");
        const heartbeatStatus = document.getElementById("heartbeat-status");
        const performanceStatus = document.getElementById("performance-status");
        const processesStatus = document.getElementById("processes-status");

        if (reportStatus) {
            reportStatus.textContent =
                data.report.has_data ? "Data available" : "No Data";
        }

        if (heartbeatStatus) {
            heartbeatStatus.textContent =
                data.heartbeat.has_data ? "Online" : "No Data";
        }

        if (performanceStatus) {
            performanceStatus.textContent =
                data.performance.has_data ? "Data available" : "No Data";
        }

        if (processesStatus) {
            processesStatus.textContent =
                data.processes.has_data ? "Data available" : "No Data";
        }
    })
    .catch(error => {
        console.error("Could not retrieve agent status:", error);
    });
