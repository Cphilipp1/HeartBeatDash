// Importing required modules
const mongoose = require('mongoose');
const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

// Importing data models
const { DeviceData, LoginData } = require('./datamodels');

// Creating an Express application
const app = express();
const port = 3000;

// Middleware setup
app.use(bodyParser.json());
app.use(cors({ origin: '*' }));

// Secret key for JWT
const jwtSecretKey = 'abcdefghijklmnop';

// Middleware to verify the token
function verifyToken(req, res, next) {
  let token = req.headers['x-access-token'] || req.headers['authorization'];
  if (token && token.startsWith('Bearer ')) {
    token = token.slice(7, token.length);
  }

  if (!token) {
    return res.status(403).json({ error: 'A token is required for authentication' });
  }

  try {
    const decoded = jwt.verify(token, jwtSecretKey);
    req.user = decoded;
  } catch (err) {
    console.log('Token verification failed:', err);
    return res.status(401).json({ error: 'Invalid Token' });
  }
  next();
}

// Helper function to format date strings
function formatDate(dateString) {
  const date = new Date(dateString);
  const optionsDate = { year: 'numeric', month: 'short', day: 'numeric' };
  const optionsTime = { hour: '2-digit', minute: '2-digit', hour12: true };
  return date.toLocaleDateString('en-US', optionsDate) + ', ' + date.toLocaleTimeString('en-US', optionsTime);
}

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/HeartTrackLogin', { useNewUrlParser: true, useUnifiedTopology: true });

// Endpoint for posting heart data
app.post('/heartData', async (req, res) => {
  try {
    const parsedData = JSON.parse(req.body.data);

    // const parsedData = req.body.data;
    const { deviceId, heartRate, bloodOxygen, apiKey } = parsedData;

    if (apiKey !== jwtSecretKey) {
      return res.status(401).json({ message: 'Invalid API key' });
    }

    const userWithDevice = await DeviceData.findOne({ deviceIds: deviceId });
    if (userWithDevice) {
      userWithDevice.readings.push({ heartRate, bloodOxygen, timestamp: new Date() });
      // userWithDevice.readings.push({ heartRate, bloodOxygen, timestamp: parsedData.timestamp });
      await userWithDevice.save();
      res.status(200).json({ message: 'Data updated successfully!' });
    } else {
      res.status(404).json({ message: 'Device not found' });
    }
  } catch (error) {
    console.error('Error in /heartData endpoint:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Endpoint for user login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const userRecord = await LoginData.findOne({ userName: email });

  if (!userRecord) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const isPasswordValid = bcrypt.compareSync(password, userRecord.password);
  if (!isPasswordValid) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = jwt.sign({ id: userRecord._id }, jwtSecretKey, { expiresIn: '1h' });
  res.status(200).json({ token });
  console.log(`Login successful for user: ${email}`);
});

// Endpoint for user registration
app.post('/api/register', async (req, res) => {
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
      console.log('New user registered:', email);

      const newDeviceData = new DeviceData({ userName: email, deviceIds: [deviceId], readings: [] });
      await newDeviceData.save();
      res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
      console.error('Registration failed:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Endpoint to get device data for a user
app.get('/api/getDeviceData/:userName', verifyToken, async (req, res) => {
  try {
    const userName = req.params.userName;
    const deviceData = await DeviceData.findOne({ userName });

    if (!deviceData) {
      return res.status(404).json({ error: 'Device data not found' });
    }

    const formattedReadings = deviceData.readings.map(reading => ({
      ...reading._doc,
      timestamp: formatDate(reading.timestamp)
    }));

    console.log(deviceData)
    console.log(formattedReadings)

    res.status(200).json({ readings: formattedReadings });
    console.log(`Device data retrieved for user: ${userName}`);
  } catch (error) {
    console.error("Error in /api/getDeviceData:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Endpoint to add a new device to a user
app.post('/addDevice', verifyToken, async (req, res) => {
  try {
      const { userName, newDeviceId } = req.body;

      if (!userName || !newDeviceId) {
          return res.status(400).json({ message: 'Username and new device ID are required' });
      }

      const result = await DeviceData.updateOne({ userName }, { $addToSet: { deviceIds: newDeviceId } });

      if (result.matchedCount === 0) {
          res.status(404).json({ message: 'User not found' });
      } else if (result.modifiedCount === 0) {
          res.status(200).json({ message: 'Device ID already registered to this user' });
      } else {
          res.status(200).json({ message: 'Device ID successfully added to user' });
          console.log(`New device added for user: ${userName}`);
      }
  } catch (error) {
      console.error("Error in /addDevice:", error);
      res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Endpoint to retrieve a user's devices
app.get('/getUserDevices/:userName', verifyToken, async (req, res) => {
  try {
      const userName = req.params.userName;
      const user = await DeviceData.findOne({ userName });

      if (user) {
          res.status(200).json({ deviceIds: user.deviceIds });
          console.log(`Device IDs retrieved for user: ${userName}`);
      } else {
          res.status(404).json({ message: 'User not found' });
      }
  } catch (error) {
      console.error("Error in /getUserDevices:", error);
      res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Endpoint to delete a device from a user's list
app.post('/deleteDevice', verifyToken, async (req, res) => {
  try {
      const { userName, deviceId } = req.body;

      if (!userName || !deviceId) {
          return res.status(400).json({ message: 'Username and device ID are required' });
      }

      const result = await DeviceData.updateOne({ userName }, { $pull: { deviceIds: deviceId } });

      if (result.matchedCount === 0) {
          res.status(404).json({ message: 'User not found' });
      } else if (result.modifiedCount === 0) {
          res.status(200).json({ message: 'Device ID not found in user\'s list' });
      } else {
          res.status(200).json({ message: 'Device ID successfully removed from user' });
          console.log(`Device removed for user: ${userName}`);
      }
  } catch (error) {
      console.error("Error in /deleteDevice:", error);
      res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Endpoint to update a user's password
app.post('/updatePassword', verifyToken, async (req, res) => {
  try {
      const { userName, currentPassword, newPassword } = req.body;

      if (!userName || !currentPassword || !newPassword) {
          return res.status(400).json({ message: 'Username, current password, and new password are required' });
      }

      const user = await LoginData.findOne({ userName });
      if (!user) {
          return res.status(404).json({ message: 'User not found' });
      }

      const isMatch = bcrypt.compareSync(currentPassword, user.password);
      if (!isMatch) {
          return res.status(401).json({ message: 'Incorrect password' });
      }

      user.password = bcrypt.hashSync(newPassword, bcrypt.genSaltSync(10));
      await user.save();
      res.status(200).json({ message: 'Password updated successfully' });
      console.log(`Password updated for user: ${userName}`);
  } catch (error) {
      console.error("Error in /updatePassword:", error);
      res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Listening on the specified port
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
