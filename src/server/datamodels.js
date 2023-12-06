// Importing the mongoose module for MongoDB interactions
const mongoose = require('mongoose');

// Define a schema for individual readings, such as heart rate and blood oxygen
const readingSchema = new mongoose.Schema({
  heartRate: {
    type: Number,
    required: true  // Heart rate is a required field
  },
  bloodOxygen: {
    type: Number,
    required: true  // Blood oxygen is a required field
  },
  timestamp: {
    type: Date,
    // default: Date.now()  // Automatically set the timestamp to the current date and time
  }
});

// Log when the reading schema is created
console.log('Reading schema created.');

// Define a schema for device data, including user info and readings
const deviceDataSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: true  // User name is a required field
  }, 
  deviceIds: [String],  // An array of device IDs
  readings: [readingSchema]  // An array of readings, based on the above schema
});

// Log when the device data schema is created
console.log('Device data schema created.');

// Create a model for device data
const DeviceData = mongoose.model('DeviceData', deviceDataSchema);

// Define a schema for login data, including username and password
const recordingSchema = new mongoose.Schema({
  userName: String,  // User name field
  password: String,  // Password field
  deviceIds: [String]  // An array of device IDs
});

// Log when the login data schema is created
console.log('Login data schema created.');

// Create a model for login data
const LoginData = mongoose.model('LoginData', recordingSchema);

// Export the models for external use
module.exports = { DeviceData, LoginData };

// Log when the module exports are successful
console.log('Module exports: DeviceData and LoginData.');
