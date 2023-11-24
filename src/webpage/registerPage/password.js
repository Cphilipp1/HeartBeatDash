document.getElementById('passwordForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const userName = localStorage.getItem('username');
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmNewPassword = document.getElementById('confirmNewPassword').value;

    // Validate the new passwords match
    if (newPassword !== confirmNewPassword) {
        alert('New passwords do not match.');
        return;
    }
    if (!isStrongPassword(newPassword)) {
        alert('Your password is not strong enough. It must contain at least one uppercase letter, one lowercase letter, one special character, and be at least 8 characters long.');
        return;
    }

    fetch('http://localhost:3000/updatePassword', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userName, currentPassword, newPassword })
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        if (data.message.includes('successfully')) {
            window.location.href = "../dashboardPage/dashboard.html";
        }
    })
    .catch(error => {
        console.error('Error updating password:', error);
    });
});

function isStrongPassword(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
    return password.length >= minLength && hasUpperCase && hasLowerCase && hasSpecialChar;
}