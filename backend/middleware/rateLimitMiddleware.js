const Claim = require("../models/Claim");
const Discussion = require("../models/Discussion");

/* =========================
   CLAIM LIMIT PER DAY
========================= */
const claimLimitMiddleware = async (req, res, next) => {
  try {
    if (req.user.role === "moderator") {
      return next(); // unlimited
    }

    const limit = req.user.role === "verified" ? 10 : 3;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const count = await Claim.countDocuments({
      createdBy: req.user._id,
      createdAt: { $gte: today }
    });

    if (count >= limit) {
      return res.status(403).json({
        error: `Daily claim limit reached (${limit}/day)`
      });
    }

    next();
  } catch (err) {
    res.status(500).json({ error: "Claim rate limit check failed" });
  }
};

/* =========================
   DISCUSSION LIMIT PER HOUR
========================= */
const discussionLimitMiddleware = async (req, res, next) => {
  try {
    if (req.user.role === "moderator") {
      return next(); // unlimited
    }

    const limit = req.user.role === "verified" ? 30 : 10;

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const count = await Discussion.countDocuments({
      author: req.user._id,
      createdAt: { $gte: oneHourAgo }
    });

    if (count >= limit) {
      return res.status(403).json({
        error: `Discussion limit reached (${limit}/hour)`
      });
    }

    next();
  } catch (err) {
    res.status(500).json({ error: "Discussion rate limit check failed" });
  }
};

module.exports = {
  claimLimitMiddleware,
  discussionLimitMiddleware
};