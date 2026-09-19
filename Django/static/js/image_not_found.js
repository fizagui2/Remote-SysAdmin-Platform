document.querySelectorAll("img").forEach((img) => {
    img.addEventListener("error", function(){
        this.src = "images/WebHost-imageNotFound.png"
    });
});