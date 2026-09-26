/* LOGIN FUNCTION */
const passwordField = document.getElementById('passwordField');
const toggleButton = document.getElementById('toggleButton');

toggleButton.addEventListener('change', function(){
    if(passwordField.type === 'password'){
        passwordField.type = 'text';
    }
    else{
        passwordField.type = 'password';
    }
});