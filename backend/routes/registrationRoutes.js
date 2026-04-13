const express = require("express");
const router = express.Router();
const {
  createRegistration,
  getAllRegistrations
} = require("../controllers/registrationController");

router.post("/preregister", createRegistration);
router.get("/registrations", getAllRegistrations);

module.exports = router;