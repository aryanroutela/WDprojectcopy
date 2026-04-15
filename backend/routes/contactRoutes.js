const express = require("express");
const router = express.Router();
const { submitContact } = require("../controllers/contactController");
const { validate } = require("../middleware/validation");

router.post("/", validate("contact"), submitContact);

module.exports = router;