// const User = require("../models/userModel");
// const asyncHandler = require("express-async-handler");
// const jwt = require("jsonwebtoken");

// // HttpOnly Cookie Approach
// // Create a JWT token using the user's ID
// const signToken = (id) => {
//   return jwt.sign({ id }, process.env.JWT_SECRET, {
//     expiresIn: process.env.JWT_EXPIRES_IN,
//   });
// };
// // Create JWT → store it in HttpOnly cookie → send response
// const createSendToken = (user, statusCode, res) => {
//   // 1. Create JWT token using the user's ID
//   const token = signToken(user._id);
//   // 2. Configure the cookie
//   const cookieOptions = {
//     maxAge: Number(process.env.JWT_COOKIE_EXPIRES_IN) * 24 * 60 * 60 * 1000,
//     httpOnly: true,
//   };
//   // 3. Make the cookie secure when running in production (HTTPS)
//   if (process.env.NODE_ENV === "production") {
//     cookieOptions.secure = true;
//   }
//   // 4. Store the JWT inside an HttpOnly cookie
//   res.cookie("jwt", token, cookieOptions);
//   // 5. Remove the password before sending the user to the client
//   user.password = undefined;
//   // 6. Send the response
//   res.status(statusCode).json({
//     status: "success",
//     data: {
//       user,
//     },
//   });
// };
// // signup
// exports.signup = asyncHandler(async (req, res) => {
//   const { name, email, password } = req.body;
//   const user = await User.create({
//     name,
//     email,
//     password,
//   });
//   // Create JWT + HttpOnly cookie + response
//   createSendToken(user, 201, res);
// });

// // login
// exports.login = asyncHandler(async (req, res) => {
//   // 1. Check email and password
//   const { email, password } = req.body;
//   if (!email || !password) {
//     return res.status(400).json({
//       status: "fail",
//       message: "Please provide email and password",
//     });
//   }
//   // 2. Find user and include password
//   const user = await User.findOne({ email }).select("+password");
//   // 3. Check user and password
//   if (!user || !(await user.correctPassword(password, user.password))) {
//     return res.status(401).json({
//       status: "fail",
//       message: "Incorrect email or password",
//     });
//   }
//   // 4. Create JWT + send cookie
//   createSendToken(user, 200, res);
// });

// // logout
// exports.logout = asyncHandler(async (req, res) => {
//   res.cookie("jwt", "", {
//     httpOnly: true,
//     expires: new Date(0),
//   });

//   res.status(200).json({
//     status: "success",
//     message: "Logged out successfully",
//   });
// });

// // ==================================
// // using access token - refresh token
// ========================================
const User = require("../models/userModel");
const Session = require("../models/sessionModel");
const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

// ========================================
// HASH REFRESH TOKEN
// ========================================

// Convert the raw refresh token into a SHA-256 hash
const hashToken = (token) => {
  return crypto
    .createHash("sha256") // Choose SHA-256 hashing algorithm
    .update(token) // Hash this refresh token
    .digest("hex"); // Return the hash as hexadecimal text
};

// ========================================
// CREATE ACCESS TOKEN
// ========================================

// Create a short-lived access token using the user's ID
const signAccessToken = (id) => {
  return jwt.sign(
    { id }, // Data stored inside the JWT
    process.env.ACCESS_TOKEN_SECRET, // Secret used to sign the token
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN, // Example: 30s
      // for day 3 we add below line
      // Makes every refresh token unique
      jwtid: crypto.randomUUID(),
    },
  );
};

// ========================================
// CREATE REFRESH TOKEN
// ========================================

// Create a longer-lived refresh token using the user's ID
const signRefreshToken = (id) => {
  return jwt.sign(
    { id },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn:
        process.env.REFRESH_TOKEN_EXPIRES_IN,

      // Give every refresh token a unique ID.
      // Even if two tokens are created in the same second,
      // they will still be different.
      jwtid: crypto.randomUUID(),
    },
  );
};

// ========================================
// CREATE TOKENS + SESSION + COOKIES
// ========================================

// Create access + refresh tokens
// Hash refresh token
// Save session in MongoDB
// Store raw tokens in HttpOnly cookies
// Send user response
const createSendToken = async (user, statusCode, res) => {
  // 1. Create short-lived access token
  const accessToken = signAccessToken(user._id);

  // 2. Create longer-lived refresh token
  const refreshToken = signRefreshToken(user._id);

  // 3. Hash the refresh token before storing it in MongoDB
  const refreshTokenHash = hashToken(refreshToken);

  // 4. Create a Session document in MongoDB
  await Session.create({
    // Connect this session to the logged-in user
    user: user._id,

    // Store only the HASH, not the raw refresh token
    refreshTokenHash,

    // For our learning test, session expires after 5 minutes
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),

    // Session starts active
    revoked: false,
  });

  // 5. Store access token in HttpOnly cookie
  res.cookie("accessToken", accessToken, {
    // Access-token cookie lasts 30 seconds for our test
    maxAge: 30 * 1000,

    // JavaScript in the browser cannot read the cookie
    httpOnly: true,

    // Cookie is sent only through HTTPS in production
    secure: process.env.NODE_ENV === "production",
  });

  // 6. Store refresh token in HttpOnly cookie
  res.cookie("refreshToken", refreshToken, {
    // Refresh-token cookie lasts 5 minutes for our test
    maxAge: 5 * 60 * 1000,

    // JavaScript in the browser cannot read the cookie
    httpOnly: true,

    // Cookie is sent only through HTTPS in production
    secure: process.env.NODE_ENV === "production",
  });

  // 7. Remove password before sending user data
  user.password = undefined;

  // 8. Send response
  res.status(statusCode).json({
    status: "success",
    data: {
      user,
    },
  });
};

// ♦️♦️♦️♦️♦️♦️♦️♦️♦️♦️♦️♦️♦️♦️
// // ========================================
// // REFRESH ACCESS TOKEN   - Day 2
// // ========================================

// // Use the refresh token to create a new access token
// exports.refresh = asyncHandler(async (req, res) => {
//   // 1. Get raw refresh token from cookie
//   const refreshToken = req.cookies.refreshToken;

//   // 2. Make sure refresh token exists
//   if (!refreshToken) {
//     return res.status(401).json({
//       status: "fail",
//       message: "Refresh token not found",
//     });
//   }

//   // 3. Verify the refresh token JWT
//   const decoded = jwt.verify(
//     refreshToken,
//     process.env.REFRESH_TOKEN_SECRET
//   );

//   // 4. Hash the incoming raw refresh token
//   const refreshTokenHash = hashToken(refreshToken);

//   // 5. Look for an active session with this hash
//   const session = await Session.findOne({
//     refreshTokenHash,
//     revoked: false,
//   });

//   // 6. If session does not exist, reject the refresh request
//   if (!session) {
//     return res.status(401).json({
//       status: "fail",
//       message: "Invalid refresh session",
//     });
//   }

//   // 7. Check whether the database session has expired
//   if (session.expiresAt < new Date()) {
//     return res.status(401).json({
//       status: "fail",
//       message: "Refresh session expired",
//     });
//   }

//   // 8. Make sure the user still exists
//   const user = await User.findById(decoded.id);

//   if (!user) {
//     return res.status(401).json({
//       status: "fail",
//       message: "User no longer exists",
//     });
//   }

//   // 9. Optional safety check:
//   // Make sure the session belongs to the same user
//   if (session.user.toString() !== user._id.toString()) {
//     return res.status(401).json({
//       status: "fail",
//       message: "Invalid refresh session",
//     });
//   }

//   // 10. Create a new access token
//   const newAccessToken = signAccessToken(user._id);

//   // 11. Store the new access token in HttpOnly cookie
//   res.cookie("accessToken", newAccessToken, {
//     maxAge: 30 * 1000,
//     httpOnly: true,
//     secure: process.env.NODE_ENV === "production",
//   });

//   // 12. Send success response
//   res.status(200).json({
//     status: "success",
//     message: "Access token refreshed",
//   });
// });
// ♦️♦️♦️♦️♦️♦️♦️♦️♦️♦️♦️♦️♦️♦️
// ========================================
// REFRESH ACCESS TOKEN + ROTATE REFRESH TOKEN  - Day 3
// ========================================

exports.refresh = asyncHandler(async (req, res) => {
  // 1. Get raw refresh token from cookie
  const refreshToken = req.cookies.refreshToken;

  // 2. Make sure refresh token exists
  if (!refreshToken) {
    return res.status(401).json({
      status: "fail",
      message: "Refresh token not found",
    });
  }

  // 3. Verify the refresh token JWT
  const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

  // 4. Hash the incoming raw refresh token
  const refreshTokenHash = hashToken(refreshToken);

  // 5. Look for an active session with this hash
  const session = await Session.findOne({
    refreshTokenHash,
    revoked: false,
  });

  // 6. If session does not exist, reject request
  if (!session) {
    return res.status(401).json({
      status: "fail",
      message: "Invalid refresh session",
    });
  }

  // 7. Check whether database session expired
  if (session.expiresAt < new Date()) {
    return res.status(401).json({
      status: "fail",
      message: "Refresh session expired",
    });
  }

  // 8. Make sure user still exists
  const user = await User.findById(decoded.id);

  if (!user) {
    return res.status(401).json({
      status: "fail",
      message: "User no longer exists",
    });
  }

  // 9. Make sure session belongs to same user
  if (session.user.toString() !== user._id.toString()) {
    return res.status(401).json({
      status: "fail",
      message: "Invalid refresh session",
    });
  }

  // 10. Create new access token
  // This already existed in Day 2
  const newAccessToken = signAccessToken(user._id);

  // ✅ DAY 3 ADDED
  // 11. Create a NEW refresh token
  // This is Refresh B
  const newRefreshToken = signRefreshToken(user._id);

  // ✅ DAY 3 ADDED
  // 12. Hash Refresh B before storing it in MongoDB
  const newRefreshTokenHash = hashToken(newRefreshToken);

  // ✅ DAY 3 ADDED
  // 13. Replace hash(Refresh A) with hash(Refresh B)
  // This makes the old Refresh A stop matching the active session
  session.refreshTokenHash = newRefreshTokenHash;

  // ✅ DAY 3 ADDED
  // 14. Reset the session expiration for the rotated refresh token
  session.expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  // ✅ DAY 3 ADDED
  // 15. Save the new refresh-token hash and expiration in MongoDB
  await session.save();

  // // 16. Store new access token in cookie
  // // This already existed in Day 2
  // res.cookie("accessToken", newAccessToken, {
  //   maxAge: 30 * 1000,
  //   httpOnly: true,
  //   secure: process.env.NODE_ENV === "production",
  // });

  // // ✅ DAY 3 ADDED
  // // 17. Replace Refresh A cookie with new Refresh B cookie
  // res.cookie("refreshToken", newRefreshToken, {
  //   maxAge: 5 * 60 * 1000,
  //   httpOnly: true,
  //   secure: process.env.NODE_ENV === "production",
  // });
  //  ✅ DAY 4 ADDED
  res.cookie("accessToken", newAccessToken, {
    maxAge: 30 * 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  res.cookie("refreshToken", newRefreshToken, {
    maxAge: 5 * 60 * 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  // 18. Send response
  res.status(200).json({
    status: "success",

    // ✅ DAY 3 CHANGED
    // Before: "Access token refreshed"
    // Now both access + refresh tokens are refreshed
    message: "Tokens refreshed successfully",
  });
});

// ========================================
// SIGNUP
// ========================================

exports.signup = asyncHandler(async (req, res) => {
  // 1. Get signup information from request body
  const { name, email, password } = req.body;

  // 2. Create new user in MongoDB
  const user = await User.create({
    name,
    email,
    password,
  });

  // 3. Create tokens + session + cookies + response
  await createSendToken(user, 201, res);
});

// ========================================
// LOGIN
// ========================================

exports.login = asyncHandler(async (req, res) => {
  // 1. Get email and password from request body
  const { email, password } = req.body;

  // 2. Make sure both fields were provided
  if (!email || !password) {
    return res.status(400).json({
      status: "fail",
      message: "Please provide email and password",
    });
  }

  // 3. Find user by email
  // +password means include password even if schema normally hides it
  const user = await User.findOne({ email }).select("+password");

  // 4. Check whether user exists and password is correct
  if (!user || !(await user.correctPassword(password, user.password))) {
    return res.status(401).json({
      status: "fail",
      message: "Incorrect email or password",
    });
  }

  // 5. Create tokens + session + cookies + response
  await createSendToken(user, 200, res);
});

// ========================================
// LOGOUT
// ========================================

exports.logout = asyncHandler(async (req, res) => {
  // 1. Get refresh token from cookie
  const refreshToken = req.cookies.refreshToken;

  // 2. If refresh token exists, revoke its database session
  if (refreshToken) {
    // Hash the refresh token
    const refreshTokenHash = hashToken(refreshToken);

    // Mark matching session as revoked
    await Session.findOneAndUpdate({ refreshTokenHash }, { revoked: true });
  }

  // 3. Clear access-token cookie
  res.cookie("accessToken", "", {
    httpOnly: true,
    expires: new Date(0),
    secure: process.env.NODE_ENV === "production",
  });

  // 4. Clear refresh-token cookie
  res.cookie("refreshToken", "", {
    httpOnly: true,
    expires: new Date(0),
    secure: process.env.NODE_ENV === "production",
  });

  // 5. Send response
  res.status(200).json({
    status: "success",
    message: "Logged out successfully",
  });
});
