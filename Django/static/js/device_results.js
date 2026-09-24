fetch("api/agent/status/")
    .then(response => response.json())
    .then(data => {
        console.log(data);
    })
    .catch(error => {
        console.error("ERROR: ", error);
    });