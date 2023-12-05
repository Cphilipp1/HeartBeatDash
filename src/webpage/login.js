function loadConstants() {
    return fetch('./constants.json')
        .then(response => response.json())
        .then(data => {
            console.log(data.IP)
            return data;
        })
        .catch(error => console.error("Error loading constants:", error));
}

document.addEventListener("DOMContentLoaded", function(e){
    loadConstants().then(constants => {       
        localStorage.setItem("ip", constants.IP);
        console.log(`http://${localStorage.getItem("ip")}:3000/api/login`)
    });
})

document.getElementById('loginForm').addEventListener('submit', function(e) {
    console.log("getting here")
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    fetch(`http://${localStorage.getItem("ip")}:3000/api/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.token) {
            console.log(data);
            localStorage.setItem('username', email);
            window.location.href = "../dashboardPage/dashboard.html";
        } else {
            console.log(data)
            loginErrorDiv.style.display = 'block'; // Show error message if login fails
            console.log(data);
        }
    });
});

function toggleTeamSection() {
    var x = document.getElementById("teamContent");
    if (x.style.display === "none") {
        x.style.display = "block";
    } else {
        x.style.display = "none";
    }
}
