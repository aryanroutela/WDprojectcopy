const express = require("express");
const router = express.Router();
const { signup, login, getProfile } = require("../controllers/authController");
const { validate } = require("../middleware/validation");
const { verifyToken } = require("../middleware/auth");

router.post("/signup", validate("user"), signup);
router.post("/login", validate("login"), login);
router.get("/profile", verifyToken, getProfile);

module.exports = router;