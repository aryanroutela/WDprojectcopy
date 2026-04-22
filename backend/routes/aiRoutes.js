const express = require("express");
const router = express.Router();
const {
  // ETA
  predictETA,
  recordTrip,
  getETAStats,
  seedDemoData,
  // Recommendations
  getSmartRecommendations,
  // Chatbot
  chatWithAI,
  getChatSuggestions
} = require("../controllers/aiController");
const { verifyToken, isAdminOrDriver } = require("../middleware/auth");

// ─── Smart ETA Prediction ─────────────────────────────────────────
router.get("/eta/predict", predictETA);                     // Public: get ETA prediction
router.get("/eta/stats", getETAStats);                      // Public: view model stats
router.post("/eta/record", verifyToken, isAdminOrDriver, recordTrip);   // Driver/Admin: record trip
router.post("/eta/seed", verifyToken, isAdminOrDriver, seedDemoData);   // Driver/Admin: seed demo data

// ─── Smart Bus Recommendation ─────────────────────────────────────
router.get("/recommend", getSmartRecommendations);          // Public: get bus recommendations

// ─── AI Chatbot ───────────────────────────────────────────────────
router.post("/chat", chatWithAI);                           // Public: chat with AI
router.get("/chat/suggestions", getChatSuggestions);        // Public: get quick suggestions

module.exports = router;
