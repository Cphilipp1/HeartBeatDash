function loadConstants() {
    return fetch('./constants.json')
        .then(response => response.json())
        .then(data => {
            return data;
        })
        .catch(error => console.error("Error loading constants:", error));
}

document.getElementById('loginForm').addEventListener('submit', function(e) {
    loadConstants().then(constants => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        fetch(`http://${constants.IP}:3000/api/login`, {
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
                localStorage.setItem('token', data.token);
                window.location.href = "../dashboardPage/dashboard.html";
            } else {
                console.log(data)
            }
        });
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
