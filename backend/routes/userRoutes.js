const express = require("express");
const router = express.Router();
const {
  getAllBuses,
  searchBusesByRoute,
  getBusDetails,
  getNearbyBuses,
  getAvailableRoutes
} = require("../controllers/userController");
const { verifyToken } = require("../middleware/auth");

// User routes (can be public or protected)
router.get("/buses", getAllBuses);
router.get("/buses/search", searchBusesByRoute);
router.get("/bus/:busId", getBusDetails);
router.get("/buses/nearby", getNearbyBuses);
router.get("/routes", getAvailableRoutes);

module.exports = router;
