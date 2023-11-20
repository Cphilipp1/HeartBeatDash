const axios = require('axios');

const DEVICE_ID = 'e00fce6869b0c02b15eef17b';
const API_URL = 'http://localhost:3000/heartData';

async function sendDummyData() {
  try {
    const heartRate = Math.floor(Math.random() * 40) + 60; // Random heart rate between 60-100
    const bloodOxygen = Math.floor(Math.random() * 10) + 90; // Random blood oxygen level between 90-100

    const response = await axios.post(API_URL, {
      deviceId: DEVICE_ID,
      heartRate: heartRate,
      bloodOxygen: bloodOxygen
    });

    console.log('Data sent successfully:', response.data);
  } catch (error) {
    console.error('Error sending data:', error.response ? error.response.data : error.message);
  }
}

setInterval(sendDummyData, 1000); // Send data every second
