const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  try {
    // Get token from headers
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided. Please login first."
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    req.userRole = decoded.role;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token. Please login again."
    });
  }
};

// Check if user is admin
const isAdmin = (req, res, next) => {
  if (req.userRole !== "admin") {
    return res.status(403).json({
      success: false,
      message: "❌ Access denied. Admin only."
    });
  }
  next();
};

// Check if user is driver
const isDriver = (req, res, next) => {
  if (req.userRole !== "driver") {
    return res.status(403).json({
      success: false,
      message: "❌ Access denied. Driver only."
    });
  }
  next();
};

// Check if user is user (passenger)
const isUser = (req, res, next) => {
  if (req.userRole !== "user") {
    return res.status(403).json({
      success: false,
      message: "❌ Access denied. User role required."
    });
  }
  next();
};

// Check if user is admin or driver
const isAdminOrDriver = (req, res, next) => {
  if (!["admin", "driver"].includes(req.userRole)) {
    return res.status(403).json({
      success: false,
      message: "❌ Access denied. Admin or Driver only."
    });
  }
  next();
};

module.exports = { verifyToken, isAdmin, isDriver, isUser, isAdminOrDriver };