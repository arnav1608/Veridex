const express = require("express");
const Claim = require("../models/Claim");
const Source = require("../models/Source");
const Verification = require("../models/Verification");
const evaluateClaim = require("../rules/evaluate");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

/* =======================
   EVALUATE CLAIM
======================= */
router.post("/:claimId", authMiddleware, async (req, res) => {
  try {

    const claim = await Claim.findById(req.params.claimId);

    if (!claim || claim.isDeleted) {
      return res.status(404).json({ error: "Claim not found" });
    }

    const sources = await Source.find({ claimId: claim._id });

    const result = evaluateClaim(sources, claim.createdAt);

    /* 🔥 SAVE SCORE PROPERLY */
    // 🔥 KEEP MODERATOR STATUS SYSTEM
if (claim.status === "pending") {
  claim.status = "pending"; // don't override moderator system
}
    claim.reliabilityScore = result.totalScore;
    claim.confidenceLevel = result.confidenceLevel;

    await claim.save();

    await Verification.create({
      claimId: claim._id,
      confidenceLevel: result.confidenceLevel
    });

    if (req.user.role === "regular") {
      return res.json({
        claimId: claim._id,
        status: result.status,
        confidenceLevel: result.confidenceLevel
      });
    }

    return res.json({
      claimId: claim._id,
      status: result.status,
      confidenceLevel: result.confidenceLevel,
      totalScore: result.totalScore,
      freshnessScore: result.freshnessScore,
      ruleBreakdown: result.ruleBreakdown,
      sourceAnalysis: result.sourceAnalysis
    });

  } catch (err) {
    console.error("EVALUATION ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;