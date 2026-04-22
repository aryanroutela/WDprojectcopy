const mongoose = require("mongoose");

/**
 * TripHistory Model
 * Records completed trip segments for AI-based ETA prediction.
 * Each document = one bus traveling between two consecutive checkpoints.
 */
const tripHistorySchema = new mongoose.Schema({
  busId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Bus",
    required: true
  },
  routeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Route",
    default: null
  },
  // Which checkpoints this segment covers
  fromCheckpoint: {
    name: { type: String, required: true },
    sequence: { type: Number, required: true },
    latitude: { type: Number },
    longitude: { type: Number }
  },
  toCheckpoint: {
    name: { type: String, required: true },
    sequence: { type: Number, required: true },
    latitude: { type: Number },
    longitude: { type: Number }
  },
  // Straight-line distance in km (Haversine)
  distanceKm: {
    type: Number,
    required: true
  },
  // Actual travel time in minutes
  travelTimeMinutes: {
    type: Number,
    required: true
  },
  // Average speed during this segment (km/h)
  avgSpeedKmh: {
    type: Number,
    default: 0
  },
  // Time context (helps the model learn traffic patterns)
  hourOfDay: {
    type: Number,   // 0-23
    required: true
  },
  dayOfWeek: {
    type: Number,   // 0=Sunday, 6=Saturday
    required: true
  },
  // Whether this was a peak hour trip
  isPeakHour: {
    type: Boolean,
    default: false
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Indexes for efficient queries
tripHistorySchema.index({ busId: 1, timestamp: -1 });
tripHistorySchema.index({ routeId: 1 });
tripHistorySchema.index({ "fromCheckpoint.name": 1, "toCheckpoint.name": 1 });
tripHistorySchema.index({ hourOfDay: 1, dayOfWeek: 1 });

module.exports = mongoose.model("TripHistory", tripHistorySchema);
