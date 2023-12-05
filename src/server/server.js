const mongoose = require('mongoose');

const express = require('express');
const bodyParser = require('body-parser');

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const { DeviceData, LoginData } = require('./datamodels');

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(cors({
  origin: '*'
}));

const jwtSecretKey = 'abcdefghijklmnop';

function verifyToken(req, res, next) {
  let token = req.headers['x-access-token'] || req.headers['authorization']; // Extract the token from header
  
  // Check if token exists and has the Bearer prefix
  if (token && token.startsWith('Bearer ')) {
    // Remove Bearer from string
    token = token.slice(7, token.length);
  }

  if (!token) {
    return res.status(403).json({ error: 'A token is required for authentication' });
  }

  try {
    const decoded = jwt.verify(token, jwtSecretKey);
    req.user = decoded;
  } catch (err) {
    console.log(err);
    return res.status(401).json({ error: 'Invalid Token' });
  }
  return next();
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const optionsDate = { year: 'numeric', month: 'short', day: 'numeric' };
  const optionsTime = { hour: '2-digit', minute: '2-digit', hour12: true };
  return date.toLocaleDateString('en-US', optionsDate) + ', ' + date.toLocaleTimeString('en-US', optionsTime);
}

mongoose.connect('mongodb://localhost:27017/HeartTrackLogin', {useNewUrlParser: true, useUnifiedTopology: true});

app.post('/heartData', async (req, res) => {
  try {
      console.log("Debug: Inside POST /heartData");
      const parsedData = JSON.parse(req.body.data);

      // Extract values and assign them to variables
      const deviceId = parsedData.deviceId;
      const heartRate = parsedData.heartRate;
      const bloodOxygen = parsedData.bloodOxygen;
      const apiKey = parsedData.apiKey;
    
      if (apiKey !== "abcdefghijklmnop") {
        return res.status(401).json({ message: 'Invalid API key' });
      }

      // Find the user who has the matching device ID
      const userWithDevice = await DeviceData.findOne({ deviceIds: deviceId });
      
      if (userWithDevice) {
          // Append the new reading to the user's data
          userWithDevice.readings.push({ heartRate, bloodOxygen, timestamp: new Date() });
          await userWithDevice.save();
          console.log("data saved");
          res.status(200).json({ message: 'Data updated successfully!' });
      } else {
          console.log("NO USER FOUND")
          res.status(404).json({ message: 'Device not found' });
      }
  } catch (error) {
      console.error("Error in /heartData endpoint:", error);
      res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.post('/api/login', async (req, res) => {
  console.log("Debug: Inside POST /api/login");
  console.log(req.body);

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const records = await LoginData.findOne({ userName: email });

  console.log(records)

  if (records.length === 0) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  const isPasswordValid = bcrypt.compareSync(password, records.password);


  if (!isPasswordValid) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = jwt.sign({ id: records._id }, 'abcdefghijklmnop', { expiresIn: '1h' });
  res.status(200).json({ token });
});

app.post('/api/register', verifyToken, async (req, res) => {
  console.log("Debug: Inside POST /api/register");

  const { email, password, deviceId } = req.body;
  if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
      const existingUser = await LoginData.findOne({ userName: email });
      if (existingUser) {
          return res.status(400).json({ error: 'Email is already registered' });
      }

      const hashedPassword = bcrypt.hashSync(password, bcrypt.genSaltSync(10));
      const newLogin = await LoginData.create({ userName: email, password: hashedPassword, deviceIds: [deviceId] });
      console.log('User inserted with message:', newLogin);

      const newDeviceData = new DeviceData({ userName: email, deviceIds: [deviceId], readings: [] });
      console.log('Device Data to be inserted:', newDeviceData);
      const deviceDataMessage = await newDeviceData.save();
      console.log('Device Data inserted with message:', deviceDataMessage);

      res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
      console.error('Failed to insert user:', err);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.get('/api/getDeviceData/:userName', verifyToken, async (req, res) => {
  try {
    const userName = req.params.userName;

    // Find the user's login data to get the deviceId
    const loginData = await LoginData.findOne({ userName: userName });

    if (!loginData) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Use the deviceId to get the device data
    const deviceData = await DeviceData.findOne({ deviceId: loginData.deviceId });
    const formattedReadings = deviceData.readings.map(reading => ({
      ...reading._doc,
      timestamp: formatDate(reading.timestamp)
    }));
    if (!deviceData) {
      return res.status(404).json({ error: 'Device data not found' });
    }

    // Send the readings back
    // res.status(200).json({ readings: deviceData.readings });
    res.status(200).json({ readings: formattedReadings });
  } catch (error) {
    console.error("Error in /api/getDeviceData endpoint:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/addDevice', verifyToken, async (req, res) => {
  try {
      const { userName, newDeviceId } = req.body;

      // Check if userName and newDeviceId are provided
      if (!userName || !newDeviceId) {
          return res.status(400).json({ message: 'Username and new device ID are required' });
      }

      // Add the new device ID to the user's device list if it's not already there
      const result = await DeviceData.updateOne(
          { userName: userName },
          { $addToSet: { deviceIds: newDeviceId } }
      );

      if (result.matchedCount === 0) {
          // No user found with the given username
          res.status(404).json({ message: 'User not found' });
      } else if (result.modifiedCount === 0) {
          // The device ID is already in the user's device list
          res.status(200).json({ message: 'Device ID already registered to this user' });
      } else {
          // New device ID successfully added
          res.status(200).json({ message: 'Device ID successfully added to user' });
      }
  } catch (error) {
      console.error("Error in /addDevice endpoint:", error);
      res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.get('/getUserDevices/:userName', verifyToken, async (req, res) => {
  try {
      const userName = req.params.userName;

      // Find the user by userName
      const user = await DeviceData.findOne({ userName: userName });

      if (user) {
          // Respond with the list of device IDs
          res.status(200).json({ deviceIds: user.deviceIds });
      } else {
          // User not found
          res.status(404).json({ message: 'User not found' });
      }
  } catch (error) {
      console.error("Error in /getUserDevices endpoint:", error);
      res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.post('/deleteDevice', verifyToken, async (req, res) => {
  try {
      const { userName, deviceId } = req.body;

      // Check if userName and deviceId are provided
      if (!userName || !deviceId) {
          return res.status(400).json({ message: 'Username and device ID are required' });
      }

      // Remove the device ID from the user's device list
      const result = await DeviceData.updateOne(
          { userName: userName },
          { $pull: { deviceIds: deviceId } }
      );

      if (result.matchedCount === 0) {
          // No user found with the given username
          res.status(404).json({ message: 'User not found' });
      } else if (result.modifiedCount === 0) {
          // The device ID is not in the user's device list
          res.status(200).json({ message: 'Device ID not found in user\'s list' });
      } else {
          // Device ID successfully removed
          res.status(200).json({ message: 'Device ID successfully removed from user' });
      }
  } catch (error) {
      console.error("Error in /deleteDevice endpoint:", error);
      res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.post('/updatePassword', verifyToken, async (req, res) => {
  try {
      const { userName, currentPassword, newPassword } = req.body;
      console.log("INSIDE UPDATE PASSWORD")
      console.log(req.body)
      // Validate input
      if (!userName || !currentPassword || !newPassword) {
          return res.status(400).json({ message: 'Username, current password, and new password are required' });
      }

      // Find the user by userName
      const user = await LoginData.findOne({ userName: userName });
      if (!user) {
          return res.status(404).json({ message: 'User not found' });
      }

      // Compare the current password with the stored hash
      const isMatch = bcrypt.compareSync(currentPassword, user.password);
      if (!isMatch) {
          return res.status(401).json({ message: 'Incorrect password' });
      }

      // Hash the new password
      const hashedNewPassword = bcrypt.hashSync(newPassword, bcrypt.genSaltSync(10));

      // Update the user's password
      user.password = hashedNewPassword;
      await user.save();

      res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
      console.error("Error in /updatePassword endpoint:", error);
      res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
