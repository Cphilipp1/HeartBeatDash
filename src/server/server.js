const express = require('express');
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');



const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// MongoDB Connection
const dbURL = 'mongodb://localhost:27017';
let db;

MongoClient.connect(dbURL, { useUnifiedTopology: true }, (err, client) => {
  if (err) {
    console.error('Failed to connect to the database');
  } else {
    db = client.db('HeartTrack');
  }
});

// Login API
app.post('/api/login', async (req, res) => {
  console.log("Debug: Inside POST /api/login");
  console.log(req.body);

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = await db.collection('users').findOne({ email });
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const isPasswordValid = bcrypt.compareSync(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = jwt.sign({ id: user._id }, 'your-secret-key', { expiresIn: '1h' });
  res.status(200).json({ token });
});

// Start Server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
