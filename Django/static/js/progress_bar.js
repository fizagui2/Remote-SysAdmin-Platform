/* FUNCTION TO CHANGE PROGRESS BAR COLOR */
export function updateProgressBar(barId, value){
    const bar = document.getElementById(barId);
    if(!bar){ return; }
    value = Number(value) || 0;
    value = Math.max(0, Math.min(value, 100));
    bar.style.width = `${value}%`;
    if(value<50){
        bar.style.background = "#4ade80";
        bar.style.boxShadow = "0 0 10px #4ade80";
    }
    else if (value < 80){
        bar.style.background = "#facc15";
        bar.style.boxShadow = "0 0 10px #facc15";
    }
    else{
        bar.style.background = "#f87171";
        bar.style.boxShadow = "0 0 10px #f87171";
    }
}