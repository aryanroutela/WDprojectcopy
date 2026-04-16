const express = require("express");
const router = express.Router();
const {
  getAllBuses,
  getBusById,
  createBus,
  updateBusSeats,
  updateBusLocation
} = require("../controllers/BusControler");
const { validate } = require("../middleware/validation");
const { verifyToken, isAdmin } = require("../middleware/auth");

// Public routes
router.get("/", getAllBuses);
router.get("/:id", getBusById);

// Admin routes
router.post("/", verifyToken, isAdmin, validate("bus"), createBus);
router.patch("/:id/seats", verifyToken, isAdmin, updateBusSeats);

// Driver endpoint
router.post("/location/update", verifyToken, updateBusLocation);

module.exports = router;