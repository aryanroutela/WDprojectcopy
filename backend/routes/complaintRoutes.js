const express = require("express");
const router = express.Router();
const {
  createComplaint,
  getAllComplaints,
  updateComplaintStatus
} = require("../controllers/complaintController");
const { verifyToken, isAdmin, isUser } = require("../middleware/auth");

// User creates a complaint
router.post("/", verifyToken, isUser, createComplaint);

// Admin views all complaints
router.get("/", verifyToken, isAdmin, getAllComplaints);

// Admin updates complaint status
router.patch("/:id/status", verifyToken, isAdmin, updateComplaintStatus);

module.exports = router;
