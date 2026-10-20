function LimitProcessesRows(table){
    document.addEventListener("DOMContentLoaded", function(){
        const table = document.getElementById("");
        const wrapper = document.getElementById("");
        const rowsToShow = 8;

        const rows = table.querySelectorAll("tbody tr");

        if(rows.length > rowsToShow){
            const header = table.querySelector("thead");
            const headerHeight = header ? header.offsetHeight : 0;
            
            let totalHeight = headerHeight;
            for(let i = 0; i < rowsToShow; i++){
                totalHeight += rows[i].offsetHeight;
            }
            wrapper.style.maxHeight = totalHeight + "px";
        }
    });

    // allRows = table.tBodies[0];
    // maxRowsToShow = 8;
    // for(let i = 0; i < allRows.length; i++){
    //     if(i >= maxRowsToShow){ allRows[i].style.display = 'none'; }
    // }
    // const btn = document.getElementById("show-more-btn");
    // let currentlyShown = maxRowsToShow;

}

function LimitServicesRows(table){
    maxRowsToShow = 10;
}