const mongoose = require("mongoose");
// Route model imported for routeId reference

const busSchema = new mongoose.Schema({
  busNumber: {
    type: String,
    required: [true, "Bus number is required"],
    unique: true,
    trim: true
  },
  routeName: {
    type: String,
    required: [true, "Route name is required"]
  },
  // Optional reference to a Route document (enables checkpoints & smart search)
  routeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Route",
    default: null
  },
  source: {
    type: String,
    required: [true, "Source is required"]
  },
  destination: {
    type: String,
    required: [true, "Destination is required"]
  },
  // Inline checkpoints (copied from Route for fast access, or set manually)
  checkpoints: [
    {
      name: { type: String },
      sequence: { type: Number },
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
      distanceFromStart: { type: Number, default: 0 }
    }
  ],
  capacity: {
    type: Number,
    required: [true, "Bus capacity is required"],
    min: 1
  },
  seatsAvailable: {
    type: Number,
    required: true
  },
  // Driver information
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Driver ID is required"]
  },
  // Real-time location
  currentLocation: {
    latitude: {
      type: Number,
      default: null
    },
    longitude: {
      type: Number,
      default: null
    },
    updatedAt: {
      type: Date,
      default: null
    }
  },
  // ETA in minutes to next stop
  eta: {
    type: Number,
    default: null
  },
  // Live checkpoint progress
  currentCheckpointIdx: { type: Number, default: -1 },
  nextCheckpointIdx: { type: Number, default: 0 },
  currentCheckpointName: { type: String, default: null },
  nextCheckpointName: { type: String, default: null },
  // Legacy stops array (kept for backward-compatibility)
  stops: [
    {
      name: String,
      sequence: Number,
      arrivalTime: Date
    }
  ],
  // Status: active, inactive, maintenance
  status: {
    type: String,
    enum: ["active", "inactive", "maintenance"],
    default: "inactive"
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp before saving
busSchema.pre("save", function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Bus", busSchema);