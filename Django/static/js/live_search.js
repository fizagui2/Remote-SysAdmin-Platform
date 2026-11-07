/* LIVE SEARCH FOR DEVICES IN DASHBOARD */
document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("search-input");
    /* Probably will be used with the 'dashboard-devices' class (or added as an id yk), and create the element using the 'load_devices.js' function yk*/
    const resultsContainer = document.getElementById("dashboard-devices"); // search-results-container
    let debounceTimer;

    searchInput.addEventListener("input", function(){
        const query = this.ariaValueMax.trim();
        clearTimeout(debounceTimer);
        if(query.length === 0){
            resultsContainer.innerHTML = "";
            return;
        }

        debounceTimer = setTimeout(() => {
            fetch(`?q=${encodeURIComponent(query)}`, {
                headers: {"X-Requested-With":"XMLHttpRequest"}
            })
            .then(response => response.text())
            .then(html => { resultsContainer.innerHTML = html; })
            .catch(error => console.error("Error fetching search results:", error));
        }, 300);
    });
    document.addEventListener("click", (event) => {
        if(!searchInput.contains(event.target) && !resultsContainer.contains(event.target)){
            resultsContainer.innerHTML = "";
        }
    });
});