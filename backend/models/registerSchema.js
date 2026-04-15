const mongoose = require("mongoose");

const registrationSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, "First name is required"],
    trim: true
  },
  lastName: {
    type: String,
    default: "",
    trim: true
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Invalid email"]
  },
  school: {
    type: String,
    required: [true, "School is required"],
    trim: true
  },
  grade: {
    type: String,
    required: [true, "Grade is required"]
  },
  referral: {
    type: String,
    default: "",
    trim: true
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index for email uniqueness
registrationSchema.index({ email: 1 }, { unique: true });

const Registration = mongoose.model("Registration", registrationSchema);

module.exports = Registration;