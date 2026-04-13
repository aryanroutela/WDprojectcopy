const mongoose = require("mongoose");

const registrationSchema = new mongoose.Schema({
  firstName:  { type: String, required: true },
  lastName:   { type: String, default: "" },
  email:      { type: String, required: true, unique: true },
  school:     { type: String, required: true },
  grade:      { type: String, required: true },
  referral:   { type: String, default: "" },
  createdAt:  { type: Date,   default: Date.now }
});

const Registration = mongoose.model("Registration", registrationSchema);

module.exports = Registration;