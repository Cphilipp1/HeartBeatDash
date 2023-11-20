const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const DeviceData = require('./datamodels'); 


const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(cors());

mongoose.connect('mongodb://localhost:27017/HeartTrackLogin', {useNewUrlParser: true, useUnifiedTopology: true});
const recordingSchema = new mongoose.Schema({
  userName: String, 
  password: String,
  deviceId: String
});

const LoginData = mongoose.model('LoginData', recordingSchema);

app.post('/heartData', async (req, res) => {
  try {
    console.log("Debug: Inside POST /heartData");

    // Extract heart rate and blood oxygen data from the request body
    const { deviceId, heartRate, bloodOxygen } = req.body;

    // Find the record associated with the device
    const deviceData = await DeviceData.findOne({ deviceId: deviceId });

    if (deviceData) {
      // Append the new reading to the device's data
      deviceData.readings.push({ heartRate, bloodOxygen, timestamp: new Date() });
      await deviceData.save();

      res.status(200).json({ message: 'Data updated successfully!' });
    } else {
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

  const token = jwt.sign({ id: records._id }, 'your-secret-key', { expiresIn: '1h' });
  res.status(200).json({ token });
});

app.post('/api/register', async (req, res) => {
  console.log("Debug: Inside POST /api/register");
  console.log(req.body);

  const { email, password, deviceId } = req.body;

  // Validate email and password
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const records = await LoginData.find({ userName: email });
  
  console.log(records)

  if (records.length !== 0) {
    return res.status(400).json({ error: 'Email is already registered' });
  }

  // Hash the password
  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(password, salt);

  // Insert the user into the database
  try {
    const newRecord = new LoginData({ userName: email, password: hashedPassword, deviceId: deviceId});
    let mesg = await newRecord.save();
    console.log('User inserted with mesg ' + mesg);
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error('Failed to insert user:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Start Server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
