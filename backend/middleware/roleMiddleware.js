const roleMiddleware = (allowedRoles = []) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: "Not authorized"
        });
      }

      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          error: "Access denied"
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        error: "Role check failed"
      });
    }
  };
};

module.exports = roleMiddleware;