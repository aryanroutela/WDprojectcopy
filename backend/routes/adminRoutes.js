const express = require("express");
const router = express.Router();
const {
  getAllBuses,
  getLiveBuses,
  getBusById,
  getAllDrivers,
  getDriverById,
  getAllUsers,
  updateDriverStatus,
  setBusMaintenance,
  getStats
} = require("../controllers/adminController");
const { verifyToken, isAdmin } = require("../middleware/auth");

// All admin routes require authentication and admin role
router.use(verifyToken, isAdmin);

// Bus management
router.get("/buses", getAllBuses);
router.get("/buses/live", getLiveBuses);
router.get("/bus/:busId", getBusById);
router.patch("/bus/:busId/maintenance", setBusMaintenance);

// Driver management
router.get("/drivers", getAllDrivers);
router.get("/driver/:driverId", getDriverById);
router.patch("/driver/:driverId/status", updateDriverStatus);

// User management
router.get("/users", getAllUsers);

// Statistics
router.get("/stats", getStats);

module.exports = router;
