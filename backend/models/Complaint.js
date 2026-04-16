const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  busNumber: {
    type: String,
    required: [true, "Bus number is required"]
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },
  description: {
    type: String,
    required: [true, "Complaint description is required"]
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },
  status: {
    type: String,
    enum: ["open", "investigating", "resolved", "dismissed"],
    default: "open"
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
complaintSchema.pre("save", function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Complaint", complaintSchema);
