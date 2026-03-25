const express = require("express");
const router = express.Router();

const {
  signup,
  login,
  verifyEmail
} = require("../controllers/authController");

/* =======================
   AUTH ROUTES
======================= */

// Signup
router.post("/signup", signup);

// Login
router.post("/login", login);

// Email Verification
router.get("/verify/:token", verifyEmail);

module.exports = router;