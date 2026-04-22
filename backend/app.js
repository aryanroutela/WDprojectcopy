require("dotenv").config();
const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");

// Routes
const authRoutes = require("./routes/authRoutes");
const driverRoutes = require("./routes/driverRoutes");
const adminRoutes = require("./routes/adminRoutes");
const userRoutes = require("./routes/userRoutes");
const contactRoutes = require("./routes/contactRoutes");
const complaintRoutes = require("./routes/complaintRoutes");
const busRoutes = require("./routes/busRoutes");
const routeRoutes = require("./routes/routeRoutes");
const aiRoutes = require("./routes/aiRoutes");

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
    version: "2.0.0",
    endpoints: {
      auth: "/api/auth",
      driver: "/api/driver",
      admin: "/api/admin",
      user: "/api/user",
      buses: "/api/buses",
      routes: "/api/routes",
      contact: "/api/contact",
      complaints: "/api/complaints",
      ai: "/api/ai"
    }
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/driver", driverRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/user", userRoutes);
app.use("/api/buses", busRoutes);
app.use("/api/routes", routeRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/ai", aiRoutes);

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