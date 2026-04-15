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
      message: "You don't have permission to access this resource."
    });
  }
  next();
};

module.exports = { verifyToken, isAdmin };