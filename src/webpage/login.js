// Function to load constants from a JSON file
function loadConstants() {
    return fetch('./constants.json')
        .then(response => response.json())
        .then(data => {
            console.log(data.IP);
            return data;
        })
        .catch(error => console.error("Error loading constants:", error));
}

// Event listener to perform actions after the DOM is fully loaded
document.addEventListener("DOMContentLoaded", function(e) {
    loadConstants().then(constants => {
        localStorage.setItem("ip", constants.IP);
        console.log(`http://${localStorage.getItem("ip")}:3000/api/login`);
    });
});

// Event listener for the login form submission
document.getElementById('loginForm').addEventListener('submit', function(e) {
    console.log("Login form submitted");
    e.preventDefault();

    // Retrieving user input from the form
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const loginErrorDiv = document.getElementById('loginError');

    // Fetch API call to login
    fetch(`http://${localStorage.getItem("ip")}:3000/api/login`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.token) {
            localStorage.setItem('username', email);
            localStorage.setItem('token', data.token);
            window.location.href = "../dashboardPage/dashboard.html"; // Redirect on successful login
        } else {
            loginErrorDiv.style.display = 'block'; // Display error message if login fails
        }
    });
});

// Function to toggle the visibility of the team section
function toggleTeamSection() {
    var teamContent = document.getElementById("teamContent");
    teamContent.style.display = (teamContent.style.display === "none") ? "block" : "none";
}
