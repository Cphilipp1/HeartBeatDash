// Event listener for the password change form submission
document.getElementById('passwordForm').addEventListener('submit', function(e) {
    e.preventDefault();

    // Retrieving user details and form inputs
    const userName = localStorage.getItem('username');
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmNewPassword = document.getElementById('confirmNewPassword').value;

    // Check if the new passwords match
    if (newPassword !== confirmNewPassword) {
        alert('New passwords do not match.');
        return;
    }

    // Validate password strength
    if (!isStrongPassword(newPassword)) {
        alert('Your password is not strong enough. It must contain at least one uppercase letter, one lowercase letter, one special character, and be at least 8 characters long.');
        return;
    }

    // Fetch API call to update the password
    const token = localStorage.getItem('token');
    fetch(`http://${localStorage.getItem("ip")}:3000/updatePassword`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userName, currentPassword, newPassword })
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        // Redirect to dashboard on successful password update
        if (data.message.includes('successfully')) {
            window.location.href = "../dashboardPage/dashboard.html";
        }
    })
    .catch(error => {
        console.error('Error updating password:', error);
    });
});

// Event listener for the back button
document.getElementById('backButton').addEventListener('click', function() {
    window.history.back();
});

// Function to check if the password is strong enough
function isStrongPassword(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
    return password.length >= minLength && hasUpperCase && hasLowerCase && hasSpecialChar;
}
