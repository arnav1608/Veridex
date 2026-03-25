const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const Source = require("../models/Source");

/* =======================
   ADD SOURCE (URL / FILE)
======================= */
router.post("/", (req, res) => {

  upload.single("referenceFile")(req, res, async function (err) {

    try {

      if (err) {
        return res.status(400).json({
          error: "File upload error: " + err.message
        });
      }

      const { claimId, sourceType, sourceURL } = req.body;

      if (!claimId || !sourceType) {
        return res.status(400).json({
          error: "claimId and sourceType are required"
        });
      }

      const sourceData = {
        claimId,
        sourceType,
        sourceURL: sourceURL || null,
        reviewedByMod: false,
        reviewStatus: "pending"
      };

      if (req.file) {
        sourceData.fileName = req.file.filename;
        sourceData.fileType = req.file.mimetype.includes("pdf")
          ? "pdf"
          : "image";
      }

      const source = await Source.create(sourceData);

// 🔥 ADD THIS BELOW
const Claim = require("../models/Claim");
const evaluateClaim = require("../rules/evaluate");

const claim = await Claim.findById(claimId);
const sources = await Source.find({ claimId });

const result = evaluateClaim(sources, claim.createdAt);

claim.reliabilityScore = result.totalScore;
claim.confidenceLevel = result.confidenceLevel;

await claim.save();

      res.status(201).json(source);

    } catch (error) {
      console.error("SOURCE ERROR:", error);
      res.status(500).json({ error: error.message });
    }

  });

});

/* =======================
   GET SOURCES BY CLAIM
======================= */
router.get("/", async (req, res) => {
  try {
    const { claimId } = req.query;

    if (!claimId)
      return res.status(400).json({
        error: "claimId is required"
      });

    const sources = await Source.find({ claimId })
      .sort({ createdAt: -1 });

    res.json(sources);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;