require("dotenv").config();
const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");

// Routes
const authRoutes = require("./routes/authRoutes");
const busRoutes = require("./routes/busRoutes");
const registrationRoutes = require("./routes/registrationRoutes");
const contactRoutes = require("./routes/contactRoutes");

// Middleware
const errorHandler = require("./middleware/errorHandler");

const app = express();

// Connect Database
connectDB();

// CORS Configuration
const corsOptions = {
  origin: [process.env.FRONTEND_URL, process.env.ADMIN_URL],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body Parser Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get("/", (req, res) => {
  res.json({ 
    message: "🚀 RouteFlow Backend Running!",
    version: "1.0.0"
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/buses", busRoutes);
app.use("/api/preregister", registrationRoutes);
app.use("/api/contact", contactRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
});

// Error Handler (must be last)
app.use(errorHandler);

module.exports = app;