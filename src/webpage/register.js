document.getElementById('registerForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const deviceId = document.getElementById('deviceId').value;
    // e00fce6869b0c02b15eef17b
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Validate that password and confirmPassword are the same
    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }

    fetch('http://localhost:3000/api/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password, deviceId })
    })
    .then(response => response.json())
    .then(data => {
        if (data.message) {
            window.location.href = "dashboard.html";
        } else {
            alert('Registration failed: ' + data.error);
        }
    })
    .catch(error => {
        console.error('There was a problem with the fetch:', error);
    });
});
