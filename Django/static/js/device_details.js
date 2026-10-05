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
        const performance = data.performance.data;
        const cpuUsage = performance.CpuUsagePercent;
        const memoryUsage = performance.MemoryUsagePercent;
        const processes = data.processes.data?.Processes || [];
        const services = data.services.data?.Services || [];

        //console tests
        console.log("Computer data:", data);
        console.log("Hostname:", data.hostname);
        console.log("Report:", data.report);
        console.log("Heartbeat:", data.heartbeat);
        console.log("Performance:", data.performance);
        console.log("Processes:", data.processes);
        console.log("Services:", data.services);
        
        // showing data in html element basis on their id's
        document.getElementById("computer-id").textContent = report.IpAddress;
        document.getElementById("cpu-usage").textContent = `${cpuUsage}%`;
        document.getElementById("memory-usage").textContent = `${memoryUsage}%`;
        
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