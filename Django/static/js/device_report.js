// >> DEVICE REPORT

// .then(response => response.json())
    // .then(data => {
    //     console.log(data);
    //     document.getElementById("hostname").textContent = data.report.data.Hostname;
    //     document.getElementById("ip-address").textContent = data.report.data.IpAddress;
    //     document.getElementById("mac-address").textContent = data.report.data.MacAddress;
    //     document.getElementById("total-ram").textContent = data.report.data.TotalRamGb;
    //     document.getElementById("logged-in-user").textContent = data.report.data.LoggedInUser;
    //     document.getElementById("network-adapter").textContent = data.report.data.NetworkAdapter;
    //     document.getElementById("cpu-cores").textContent = data.report.data.CpuCores;
    //     document.getElementById("cpu-model").textContent = data.report.data.CpuModel;
    //     document.getElementById("cpu-usage").textContent = `${data.performance.data.CpuUsagePercent}%`;
    //     document.getElementById("memory-usage").textContent = `${data.performance.data.MemoryUsagePercent}%`;
    //     document.getElementById("heartbeat-status").textContent = data.heartbeat.has_data ? "Online" : "Offline";
    // })
    // .catch(error => {
    //     console.error("Could not retrieve agent status:", error);
    // });