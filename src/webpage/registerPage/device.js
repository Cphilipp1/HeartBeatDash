document.addEventListener('DOMContentLoaded', () => {
    const userName = localStorage.getItem('username');
    if (userName) {
        fetchRegisteredDevices(userName);
    } else {
        alert("User not logged in.");
    }
});

function fetchRegisteredDevices(userName) {
    const token = localStorage.getItem('token');
    fetch(`http://${localStorage.getItem("ip")}:3000/getUserDevices/${userName}`,
    {  headers: {
        'Authorization': `Bearer ${token}`
      }})
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        displayRegisteredDevices(data.deviceIds);
    })
    .catch(error => {
        console.error('Error fetching registered devices:', error);
    });
}

function displayRegisteredDevices(deviceIds) {
    const list = document.getElementById('deviceList');
    list.innerHTML = ''; // Clear existing list items

    if (deviceIds.length === 0) {
        list.innerHTML = '<li>No registered devices</li>';
    } else {
        deviceIds.forEach(deviceId => {
            const listItem = document.createElement('li');
            listItem.textContent = deviceId;

            // Create a delete button for each device
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete Device';
            deleteButton.addEventListener('click', () => deleteDevice(deviceId));

            listItem.appendChild(deleteButton);
            list.appendChild(listItem);
        });
    }
}

function deleteDevice(deviceId) {
    const userName = localStorage.getItem('username');
    if (!userName) {
        alert('No user logged in');
        return;
    }
    const token = localStorage.getItem('token');

    fetch(`http://${localStorage.getItem("ip")}:3000/deleteDevice`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userName, deviceId })
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message); // Alert the message from the response
        if (data.message.includes('successfully removed')) {
            // Refresh the device list
            fetchRegisteredDevices(userName);
        }
    })
    .catch(error => {
        console.error('Error deleting device:', error);
    });
}

document.getElementById('registerForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const userName = localStorage.getItem('username'); // Retrieve username from local storage
    const deviceId = document.getElementById('deviceId').value;

    if (!userName) {
        alert('No user logged in');
        return;
    }

    if (!deviceId) {
        alert('Device ID is required');
        return;
    }
    const token = localStorage.getItem('token');

    fetch(`http://${localStorage.getItem("ip")}:3000/addDevice`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userName, newDeviceId: deviceId })
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message); // Alert the message from the response
        if (data.message.includes('successfully')) {
            window.location.href = "../dashboardPage/dashboard.html"; // Redirect on successful addition
        }
    })
    .catch(error => {
        console.error('There was a problem with the fetch:', error);
        alert('Error registering device');
    });
});
