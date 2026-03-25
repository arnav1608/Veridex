const mongoose = require("mongoose");

/*
  Claim = neutral unit of public information
*/

const ClaimSchema = new mongoose.Schema(
  {
    claimText: {
      type: String,
      required: true,
      trim: true,
      index: true
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    status: {
      type: String,
      enum: ["pending", "accepted", "flagged", "rejected"],
      default: "pending",
      index: true
    },

    /* 🔥 STORE EVALUATION SCORE */
    reliabilityScore: {
      type: Number,
      default: null,
      min: 0,
      max: 100
    },

    confidenceLevel: {
      type: String,
      enum: ["low", "medium", "high", null], // ✅ allow null
      default: null
    },

    isLocked: {
      type: Boolean,
      default: false
    },

    isDeleted: {
      type: Boolean,
      default: false
    },

    aiAnalysis: {
      structuredClaim: {
        authority: { type: String, default: "" },
        action: { type: String, default: "" },
        subject: { type: String, default: "" },
        scope: { type: String, default: "" },
        timeline: { type: String, default: "" }
      },
      similarClaims: [],
      conflicts: [],
      timeline: [],
      signals: {
        type: [String],
        default: []
      },
      summary: {
        type: String,
        default: ""
      }
    }
  },
  {
    timestamps: true,
    strict: true
  }
);

module.exports = mongoose.model("Claim", ClaimSchema);