// const jwt = require("jsonwebtoken");
// const User = require("../models/userModel");
// const AppError = require("../utils/appError");

// exports.protect = async (req, res, next) => {
//   try {
//     let token;

//     // 1. Check if JWT exists in cookies
//     if (req.cookies.jwt) {
//       token = req.cookies.jwt;
//     }

//     // 2. No token
//     if (!token) {
//       throw new AppError("You are not logged in", 401);
//     }

//     // 3. Verify JWT
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);

//     // 4. Find user
//     const currentUser = await User.findById(decoded.id);

//     if (!currentUser) {
//       throw new AppError(
//         "The user belonging to this token no longer exists",
//         401,
//       );
//     }

//     // 5. Put user on request
//     req.user = currentUser;

//     // 6. Continue
//     next();
//   } catch (error) {
//     if (error instanceof AppError) {
//       return next(error);
//     }

//     return next(new AppError("Invalid or expired token", 401));
//   }
// };

// // =========================
// // use access token and refresh token
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const AppError = require("../utils/appError");

exports.protect = async (req, res, next) => {
  try {
    let accessToken;

    // 1. Get access token from cookie
    if (req.cookies.accessToken) {
      accessToken = req.cookies.accessToken;
    }

    // 2. No access token
    if (!accessToken) {
      throw new AppError("You are not logged in", 401);
    }

    // 3. Verify access token
    const decoded = jwt.verify(
      accessToken,
      process.env.ACCESS_TOKEN_SECRET
    );

    // 4. Find user
    const currentUser = await User.findById(decoded.id);

    if (!currentUser) {
      throw new AppError(
        "The user belonging to this token no longer exists",
        401
      );
    }

    // 5. Put user on request
    req.user = currentUser;

    // 6. Continue
    next();
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }

    return next(
      new AppError("Invalid or expired access token", 401)
    );
  }
};
