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
  capacity: {
    type: Number,
    required: [true, "Bus capacity is required"],
    min: 1
  },
  seatsAvailable: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ["active", "inactive", "maintenance"],
    default: "active"
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
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