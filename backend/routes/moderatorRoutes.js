// backend/routes/moderatorRoutes.js

const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const requireModerator = require("../middleware/requireModerator");

const moderatorController = require("../controllers/moderatorController");
router.patch("/claim/:id/accept", authMiddleware, requireModerator, moderatorController.acceptClaim);
router.patch("/claim/:id/flag", authMiddleware, requireModerator, moderatorController.flagClaim);
router.patch("/claim/:id/reject", authMiddleware, requireModerator, moderatorController.rejectClaim);

/* =========================
   DASHBOARD SUMMARY
========================= */
router.get(
  "/dashboard",
  authMiddleware,
  requireModerator,
  moderatorController.getDashboard
);

/* =========================
   CLAIM MANAGEMENT
========================= */

// Get all claims
router.get(
  "/claims",
  authMiddleware,
  requireModerator,
  moderatorController.getAllClaims
);

// Lock a claim discussion
router.patch(
  "/claim/:id/lock",
  authMiddleware,
  requireModerator,
  moderatorController.lockClaim
);

// Remove a claim
router.delete(
  "/claim/:id",
  authMiddleware,
  requireModerator,
  moderatorController.removeClaim
);

/* =========================
   USER MANAGEMENT
========================= */

// Get all users
router.get(
  "/users",
  authMiddleware,
  requireModerator,
  moderatorController.getAllUsers
);

// Suspend user
router.patch(
  "/user/:id/suspend",
  authMiddleware,
  requireModerator,
  moderatorController.suspendUser
);

module.exports = router;