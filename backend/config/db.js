const mongoose = require("mongoose");

const MONGODB_URI = "mongodb://localhost:27017";

const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("MongoDB connected");
  } catch (err) {
    console.log("MongoDB error:", err);
    process.exit(1);
  }
};

module.exports = connectDB;