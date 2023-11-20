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
    deviceId: {
      type: String,
      required: true,
      unique: true
    },
    readings: [readingSchema]
    // Optionally, add a reference to the User model if applicable
    // userId: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: 'User'
    // }
  });

const DeviceData = mongoose.model('DeviceData', deviceDataSchema);

module.exports = DeviceData;