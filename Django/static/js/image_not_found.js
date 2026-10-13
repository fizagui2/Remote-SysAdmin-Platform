// IMAGE NOT FOUND FUNCTION
document.addEventListener("error", function(event){
    const target = event.target;
    if(target.tagName === "IMG" && !target.dataset.fallbackUsed){
        target.dataset.fallbackUsed = "true";
        target.src = IMAGE_NOT_FOUND;
    }
}, true);


// const script = document.currentScript;
// const fallbackImage = script.dataset.fallback;

// this.src = this.dataset.fallback;
// "images/WebHost-imageNotFound.png"


// DIDN'T WORK PERO EL MAS ACCURATE CREO
// document.querySelectorAll("img").forEach((img) => {
//     img.addEventListener("error", function(){
//         if(!this.dataset.fallbackUsed){
//             this.dataset.fallbackUsed = "true";
//             this.src = IMAGE_NOT_FOUND;
//         }
//     });
// });