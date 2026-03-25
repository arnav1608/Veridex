const mongoose = require("mongoose");

const VerificationSchema = new mongoose.Schema(
  {
    claimId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Claim",
      required: true,
      index: true
    },

    confidenceLevel: {
      type: String,
      enum: ["low", "medium", "high"],
      required: true
    }
  },
  {
    timestamps: true,
    strict: true
  }
);

module.exports = mongoose.model("Verification", VerificationSchema);
