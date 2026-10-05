// RETRIEVEN THE DATA OF THE COMPUTERS FROM THE DATABASE INTO JSON VARIABLE
fetch(`/api/agent/status/?hostname=${encodeURIComponent(COMPUTER_HOSTNAME)}`)
    .then(response => {
        if(!response.ok){
            throw new Error("Could not retrieve computer data.");
        }
        return response.json();
    })
    .then(data => {
        // variables
        const report = data.report.data;
        const heartbeat = data.heartbeat.data;
        const performance = data.performance.data;
        
        const cpUsage = performance.CpuUsagePercent;
        const memoryUsed = performance.MemoryUsedGb;
        const memoryAvailable = performance.MemoryAvailableGb;
        const memoryUsagePercentage = performance.MemoryUsagePercent;
        
        const processes = data.processes.data?.Processes || [];
        const services = data.services.data?.Services || [];
        //console tests FOR JSONS AND DATA 
        console.log("Computer data:", data);
        console.log("Hostname:", data.hostname);
        console.log("Report:", data.report);
        console.log("Heartbeat:", data.heartbeat);
        console.log("Performance:", data.performance);
        console.log("Processes:", data.processes);
        console.log("Services:", data.services);
        
        // >> DEVICE INFORMATION (showing data in html element basis on their id's)
        // REPORT (completed)
        document.getElementById("hostname").textContent = `💻 ${data.hostname} 💻`;
        document.getElementById("net-adapter").textContent = report.NetworkAdapter ?? "N/A";
        document.getElementById("ip-address").textContent = report.IpAddress ?? "N/A";
        document.getElementById("mac-address").textContent = report.MacAddress ?? "N/A";
        document.getElementById("win-version").textContent = report.WindowsVersion ?? "N/A";
        document.getElementById("cpu-cores").textContent = report.CpuCores ?? "N/A";
        document.getElementById("cpu-model").textContent = report.CpuModel ?? "N/A";
        document.getElementById("total-ram").textContent = report.TotalRamGb ? `${report.TotalRamGb} GB` : "N/A";
        document.getElementById("uptime-hours").textContent = report.UptimeHours ?? "N/A";
        document.getElementById("logged-in-user").textContent = report.LoggedInUser ?? "Undentified user";
        // need to show in bar table or circle table
        document.getElementById("drives").textContent = report.Drives ?? "N/A";
        
        // HEARTBEAT
        document.getElementById("heartbeat-timestamp").textContent = heartbeat.Timestamp;
        
        // PERFORMANCE
        document.getElementById("cpu-usage").textContent = `${cpUsage}%`;
        document.getElementById("memory-usage").textContent = `${memoryUsed}%`;
        document.getElementById("memory-available").textContent = `${memoryAvailable}%`;
        document.getElementById("memory-percent").textContent = `${memoryUsagePercentage}%`;
        document.getElementById("disk-usage").textContent = `${diskUsage}%`;
        
        // PROCESSES
        const processTable = document.getElementById("processes-table-body");
        processTable.innerHTML = "";
        processes.forEach(process => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${process.Name ?? "Unknown"}</td>
                <td>${process.Pid ?? "N/A"}</td>
                <td>${process.MemoryMb ?? "N/A"} MB</td>
            `;
            processTable.appendChild(row);
        });

        // SERVICES
        const serviceTable = document.getElementById("services-table-body");
        serviceTable.innerHTML = "";
        services.forEach(service => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${service.Name ?? "Unknown"}</td>
                <td>${service.DisplayName ?? "Unknown"}</td>
                <td>${service.Status ?? "Unknown"}</td>
            `
            serviceTable.appendChild(row);
        });
    })
    .catch(error => {
        console.error("Could not retrieve computer information: ", error);
    });