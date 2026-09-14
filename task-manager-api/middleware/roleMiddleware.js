
const AppError = require("../utils/appError");

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          "You do not have permission to perform this action",
          403
        )
      );
    }

    next();
  };
};

module.exports = {
  restrictTo,
};

// Why are we changing it?
// Your old version:
// restrictTo
//    ↓
// creates its own 403 response
//    ↓
// res.status(403).json(...)

// New professional version:

// restrictTo
//    ↓
// finds an error
//    ↓
// next(new AppError(...))
//    ↓
// Global Error Handler
//    ↓
// sends the response

// This gives your API one consistent place for errors instead of every middleware/controller creating errors differently.

// One small change too:

// ...role

// to:

// ...roles

// Both technically work, but roles is clearer because it can contain several roles:

// restrictTo("admin", "manager"),
