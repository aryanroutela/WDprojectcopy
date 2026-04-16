const express = require("express");
const router = express.Router();
const {
  registerBus,
  updateBusLocation,
  updateSeatAvailability,
  startService,
  stopService,
  getMyBuses,
  getBusDetails
} = require("../controllers/driverController");
const { verifyToken, isDriver } = require("../middleware/auth");
const { validate } = require("../middleware/validation");

// All driver routes require authentication and driver role
router.use(verifyToken, isDriver);

// Bus management
router.post("/bus/register", validate("bus"), registerBus);
router.get("/buses", getMyBuses);
router.get("/bus/:busId", getBusDetails);

// Real-time updates
router.post("/bus/location", updateBusLocation);
router.patch("/bus/:busId/seats", updateSeatAvailability);

// Service control
router.post("/bus/:busId/start", startService);
router.post("/bus/:busId/stop", stopService);

module.exports = router;
