const express = require("express");
const router = express.Router();
const {
  createRegistration,
  getAllRegistrations,
  getRegistrationById,
  updateRegistrationStatus
} = require("../controllers/registrationController");
const { validate } = require("../middleware/validation");
const { verifyToken, isAdmin } = require("../middleware/auth");

// Public
router.post("/preregister", validate("registration"), createRegistration);

// Admin
router.get("/registrations", verifyToken, isAdmin, getAllRegistrations);
router.get("/registrations/:id", verifyToken, isAdmin, getRegistrationById);
router.patch("/registrations/:id/status", verifyToken, isAdmin, updateRegistrationStatus);

module.exports = router;