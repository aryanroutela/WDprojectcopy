const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema({
  busId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Bus",
    required: true
  },
  latitude: {
    type: Number,
    required: [true, "Latitude is required"]
  },
  longitude: {
    type: Number,
    required: [true, "Longitude is required"]
  },
  speed: {
    type: Number,
    default: 0
  },
  timestamp: {
    type: Date,
    default: Date.now,
    expires: 86400  // Auto-delete after 24 hours
  }
});

// Index for efficient queries
locationSchema.index({ busId: 1, timestamp: -1 });

module.exports = mongoose.model("Location", locationSchema);