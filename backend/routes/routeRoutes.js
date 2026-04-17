const express = require("express");
const router = express.Router();
const {
  createRoute,
  getAllRoutes,
  getRouteById,
  updateRoute,
  deleteRoute,
  searchBusesByStop
} = require("../controllers/routeController");
const { verifyToken, isAdmin } = require("../middleware/auth");

// Public
router.get("/", getAllRoutes);
router.get("/search", searchBusesByStop);   // Smart search: any stop in route
router.get("/:id", getRouteById);

// Admin only
router.post("/", verifyToken, isAdmin, createRoute);
router.put("/:id", verifyToken, isAdmin, updateRoute);
router.delete("/:id", verifyToken, isAdmin, deleteRoute);

module.exports = router;
