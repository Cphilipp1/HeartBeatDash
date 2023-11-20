const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(cors());

mongoose.connect('mongodb://localhost:27017/HeartTrackLogin', {useNewUrlParser: true, useUnifiedTopology: true});
const recordingSchema = new mongoose.Schema({
  userName: String, 
  password: String
});

const Recording = mongoose.model('Recording', recordingSchema);

app.post('/heartData', async (req, res) => {
  console.log("Debug: Inside POST /api/heartInfo");
  console.log(req);
  console.log(req.body);
  console.log("We made it");
  res.status(200).json({ message: 'endpoint exists!' });
});

app.post('/api/login', async (req, res) => {
  console.log("Debug: Inside POST /api/login");
  console.log(req.body);

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const records = await Recording.findOne({ userName: email });

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

  const { email, password } = req.body;

  // Validate email and password
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const records = await Recording.find({ userName: email });
  // const user = await db.collection('users').findOne({ email });

  console.log(records)

  if (records.length !== 0) {
    return res.status(400).json({ error: 'Email is already registered' });
  }

  // Hash the password
  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(password, salt);

  // Insert the user into the database
  try {
    const newRecord = new Recording({ userName: email, password: hashedPassword });
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
