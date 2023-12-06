// Event listener for the registration form submission
document.getElementById('registerForm').addEventListener('submit', function(e) {
    e.preventDefault();

    // Retrieving values from the form
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const deviceId = document.getElementById('deviceId').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Validate that password and confirmPassword are the same
    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }

    // Check if the password is strong enough
    if (!isStrongPassword(password)) {
        alert('Your password is not strong enough. It must contain at least one uppercase letter, one lowercase letter, one special character, and be at least 8 characters long.');
        return;
    }

    // Fetch API call to register the user
    const token = localStorage.getItem('token');
    fetch(`http://${localStorage.getItem("ip")}:3000/api/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email, password, deviceId })
    })
    .then(response => response.json())
    .then(data => {
        // Redirect to the main page if registration is successful
        if (data.message) {
            window.location.href = "../index.html";
        } else {
            alert('Registration failed: ' + data.error);
        }
    })
    .catch(error => {
        console.error('There was a problem with the fetch:', error);
    });
});

// Function to check the strength of the password
function isStrongPassword(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
    return password.length >= minLength && hasUpperCase && hasLowerCase && hasSpecialChar;
}
