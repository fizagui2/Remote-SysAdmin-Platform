let darkmode = localStorage.getItem('darkmode');
const themeSwitch = document.getElementById('theme-switch');

const enableDarkmode = () => {
    document.body.classList.add('darkmode');
    localStorage.setItem('darkmode','active');
}

const disableDarkmode = () => {
    document.body.classList.remove('darkmode');
    localStorage.setItem('darkmode', 'inactive');
}

//if(darkmode === "active"){ enableDarkmode(); }

if(localStorage.getItem('darkmode') === 'active'){
    enableDarkmode();
}

if(themeSwitch){
    themeSwitch.addEventListener("click", ()=> {
        if(document.body.classList.contains('darkmode')){ disableDarkmode(); }
        else{ enableDarkmode(); }
});
}