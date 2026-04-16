const mongoose = require("mongoose");

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
  source: {
    type: String,
    required: [true, "Source is required"]
  },
  destination: {
    type: String,
    required: [true, "Destination is required"]
  },
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
  // Current stops (array of details)
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