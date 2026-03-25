const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    password: {
      type: String,
      required: true,
      minlength: 8
    },

    role: {
      type: String,
      enum: ["regular", "verified", "moderator"],
      default: "regular"
    },

    accountStatus: {
      type: String,
      enum: ["pending", "active", "suspended"],
      default: "pending"
    },

    verificationToken: {
      type: String
    },

    verificationTokenExpires: {
      type: Date
    },

    suspensionReason: {
      type: String,
      default: null
    }
  },
  { timestamps: true }
);

/* =========================
   PASSWORD HASHING
========================= */
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

/* =========================
   PASSWORD CHECK
========================= */
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

/* =========================
   GENERATE VERIFICATION TOKEN
========================= */
UserSchema.methods.generateVerificationToken = function () {
  const token = crypto.randomBytes(32).toString("hex");

  this.verificationToken = token;
  this.verificationTokenExpires = Date.now() + 60 * 60 * 1000; // 1 hour

  return token;
};

module.exports = mongoose.model("User", UserSchema);