export const ComputerNavigation = (() => {
    let computers = [];
    let currentIndex = 0;
    let loadComputerData = null;

    const hostnameElement = document.getElementById("computer-hostname");
    const counterElement = document.getElementById("computer-counter");
    const previousButton = document.getElementById("previous-computer");
    const nextButton = document.getElementById("next-computer");

    async function initialize(dataLoader){
        loadComputerData = dataLoader;
        try{
            const response = await fetch("/api/agent/computers/");
            if(!response.ok){
                throw new Error("Could not retrieve computers.")
            }
            const data = await response.json();
            computers = data.computers ?? [];
            if(computers.length === 0){
                hostnameElement.textContent = "No computers found";
                counterElement.textContent = "";
                return;
            }
            previousButton.addEventListener("click", previousButton);
            counterElement.addEventListener("click", nextButton);

            await displayComputer();
        }catch(error){
            console.error(error);
            hostnameElement.textContent = "Unable to load computers.";
        }
    }

    async function displayComputer(){
        const computer = computers[currentIndex];
        hostnameElement.textContent = computer.hostname;
        counterElement.textContent = `Computer ${currentIndex + 1} of ${computers.length}`;
        previousButton.disabled = currentIndex === 0;
        nextButton.disabled = currentIndex === computers.length - 1;

        await loadComputerData(computer.hostname);
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

    return { initialize };
})();