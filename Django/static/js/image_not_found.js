// const script = document.currentScript;
// const fallbackImage = script.dataset.fallback;

document.querySelectorAll("img").forEach((img) => {
    img.addEventListener("error", function(){
        if(!this.dataset.fallbackUsed){
            this.dataset.fallbackUsed = "true";
            this.src = IMAGE_NOT_FOUND;
        }
    });
});

// this.src = this.dataset.fallback;
// "images/WebHost-imageNotFound.png"