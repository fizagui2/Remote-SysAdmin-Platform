export const ComputerNavigation = (() => {
    let computers = [];
    let currentIndex = 0;
    let loadComputerData = null;

    const hostnameElement = document.getElementById("computer-hostname");
    const counterElement = document.getElementById("computer-counter");
    const firstButton = document.getElementById("gofirst-computer");
    const previousButton = document.getElementById("previous-computer");
    const nextButton = document.getElementById("next-computer");
    const lastButton = document.getElementById("last-computer");

    async function initialize(dataLoader){
        loadComputerData = dataLoader;
        try{
            const response = await fetch("/api/agent/computers/");
            if(!response.ok){
                throw new Error(`Computers HTTP: ${response.status}`);
            }
            const data = await response.json();
            computers = data.computers ?? [];
            if(computers.length === 0){
                hostnameElement.textContent = "No computers found";
                counterElement.textContent = "";
                return;
            }
            firstButton?.addEventListener("click", firstComputer);
            previousButton?.addEventListener("click", previousComputer);
            nextButton?.addEventListener("click", nextComputer);
            lastButton?.addEventListener("click", lastComputer);

            await displayComputer();
            //counterElement.addEventListener("click", nextComputer);
        }catch(error){
            console.error("Navigation error: ", error);
            hostnameElement.textContent = "Unable to load computers.";
        }
    }

    // HELPER FUNCTION TO DISPLAY COMPUTER NAME
    async function displayComputer(){
        const computer = computers[currentIndex];
        const hostname = computer.hostname ?? computer.Hostname ?? "Unknown";
        counterElement.textContent = `Computer ${currentIndex + 1} of ${computers.length}`;
        // hostnameElement.textContent = computer.hostname;
        // previousButton.disabled = currentIndex === 0;
        // nextButton.disabled = currentIndex === computers.length - 1;
        if(firstButton){ firstButton.disabled = currentIndex === 0; }
        if(previousButton){ previousButton.disabled = currentIndex === 0; }
        if(nextButton){ nextButton.disabled = currentIndex === computers.length - 1; }
        if(lastButton){ lastButton.disabled = currentIndex === computers.length - 1; }
        await loadComputerData(computer.hostname);
    }
    // >>> HELPER FUNCTIONS FOR NAV BUTTONS
    async function firstComputer(){
        if(currentIndex !== 0){
            currentIndex = 0;
            await displayComputer();
        }
    }
    async function previousComputer(){
        if(currentIndex > 0){
            currentIndex--;
            await displayComputer();
        }
    }
    async function nextComputer(){
        if(currentIndex < computers.length - 1){
            currentIndex++;
            await displayComputer();
        }
    }
    async function lastComputer(){
        if(currentIndex !== computers.length - 1){
            currentIndex = computers.length - 1;
            await displayComputer();
        }
    }
    return { initialize };
})();