/* >> SORTING PROCESSES TABLE */
export function renderProcesses(currentProcesses, processSortOrder){
    const processTable = document.getElementById("processes-table-body");
    if(!processTable){ return; }
    const sortedProcesses = [...currentProcesses];
    sortedProcesses.sort((a, b) => {
        switch(processSortOrder){
            case "memory-asc":
                return (Number(a.MemoryMb) || 0) - (Number(b.MemoryMb) || 0);
            case "memory-desc":
                return (Number(b.MemoryMb) || 0) - (Number(a.MemoryMb) || 0);

            case "name-asc":
                return (a.Name ?? "").localeCompare(b.Name ?? "");
            case "name-desc":
                return (b.Name ?? "").localeCompare(a.Name ?? "");
            
            case "pid-asc":
                return (Number(a.Pid) || 0) - (Number(b.Pid) || 0);
            case "pid-desc":
                return (Number(b.Pid) || 0) - (Number(a.Pid) || 0);

            default:
                return 0;
        }
    });
    processTable.innerHTML = "";
    sortedProcesses.forEach(process => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${process.Pid ?? "N/A"}</td>
            <td>${process.Name ?? "Unknown"}</td>
            <td>${process.MemoryMb ?? "N/A"} MB</td>
            <td><button class="container-buttons-main btn rounded-pill px-3 btn-sm" data-pid="${process.Pid}">Terminate</button></td>
        `;
        processTable.appendChild(row);
    });
}