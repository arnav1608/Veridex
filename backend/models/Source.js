const mongoose = require("mongoose");

const SourceSchema = new mongoose.Schema(
  {
    /* =======================
       CLAIM CONTEXT
    ======================= */
    claimId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Claim",
      required: true,
      index: true
    },

    /* =======================
       SOURCE IDENTITY
    ======================= */
    sourceType: {
      type: String,
      enum: ["official", "media", "user", "document"],
      required: true
    },

    /* =======================
       URL-BASED SOURCE
    ======================= */
    sourceURL: {
      type: String,
      default: null
    },

    /* =======================
       FILE-BASED SOURCE
    ======================= */
    fileName: {
      type: String,
      default: null
    },

    fileType: {
      type: String,
      enum: ["pdf", "image", null], // ✅ allow null explicitly
      default: null
    },

    /* =======================
       MODERATION / REVIEW
    ======================= */
    reviewedByMod: {
      type: Boolean,
      default: false
    },

    reviewStatus: {
      type: String,
      enum: ["pending", "relevant", "irrelevant", "outdated"],
      default: "pending"
    }
  },
  {
    timestamps: true,
    strict: true
  }
);

module.exports = mongoose.model("Source", SourceSchema);