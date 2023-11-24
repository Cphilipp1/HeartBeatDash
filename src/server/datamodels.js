const mongoose = require('mongoose');

const readingSchema = new mongoose.Schema({
    heartRate: {
      type: Number,
      required: true
    },
    bloodOxygen: {
      type: Number,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  });

const deviceDataSchema = new mongoose.Schema({
    userName: {
      type: String,
      required: true
    }, 
    deviceIds: [String],
    readings: [readingSchema]
  });

const DeviceData = mongoose.model('DeviceData', deviceDataSchema);

const recordingSchema = new mongoose.Schema({
    userName: String, 
    password: String,
    deviceIds: [String]
});
  
const LoginData = mongoose.model('LoginData', recordingSchema);

module.exports = { DeviceData, LoginData };
