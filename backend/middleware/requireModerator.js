// backend/middleware/requireModerator.js

module.exports = function (req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: "Authentication required"
    });
  }

  if (req.user.role !== "moderator") {
    return res.status(403).json({
      error: "Moderator access required"
    });
  }

  next();
};