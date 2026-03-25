const express = require("express");
const Claim = require("../models/Claim");

const authMiddleware = require("../middleware/authMiddleware");
const { claimLimitMiddleware } = require("../middleware/rateLimitMiddleware");

const router = express.Router();

/*
  POST /claims
  Create a new claim
*/
router.post(
  "/",
  authMiddleware,
  claimLimitMiddleware,
  async (req, res) => {
    try {
      const { claimText } = req.body;

      if (!claimText || claimText.trim() === "") {
        return res.status(400).json({
          error: "Claim text is required"
        });
      }

      const claim = new Claim({
        claimText,
        createdBy: req.user._id,
        status: "pending"
      });

      await claim.save();

      res.status(201).json(claim);
    } catch (err) {
      console.error("Error creating claim:", err);
      res.status(500).json({
        error: "Server error while creating claim"
      });
    }
  }
);

/*
  GET /claims
  Fetch all claims (excluding deleted)
*/
router.get("/", async (req, res) => {
  try {
    const claims = await Claim.find({
  isDeleted: false,
  status: { $ne: "rejected" }   // 🔥 ADD THIS
}).sort({ createdAt: -1 });

    res.json(claims);
  } catch (err) {
    res.status(500).json({
      error: "Server error while fetching claims"
    });
  }
});

/*
  GET /claims/:id
*/
router.get("/:id", async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.id);

    if (!claim || claim.isDeleted) {
      return res.status(404).json({
        error: "Claim not found"
      });
    }

    res.json(claim);
  } catch (err) {
    res.status(500).json({
      error: "Server error while fetching claim"
    });
  }
});

module.exports = router;