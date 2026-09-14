const asyncHandler = require("express-async-handler");

const userService = require("../services/userService");

exports.getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    status: "success",
    data: {
      user: req.user,
    },
  });
});

exports.adminTest = asyncHandler(async (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Welcome Admin",
  });
});

exports.getAllUsers = asyncHandler(async (req, res) => {
  const users = await userService.getAllUsers();

  if (users.length === 0) {
    return res.status(200).json({
      status: "success",
      message: "No users found",
      results: 0,
      data: {
        users: [],
      },
    });
  }

  res.status(200).json({
    status: "success",
    results: users.length,
    data: {
      users,
    },
  });
});

exports.deleteUser = asyncHandler(async (req, res) => {
  await userService.deleteUser(req.params.id);

  res.status(200).json({
    status: "success",
    message: "User deleted successfully",
  });
});

exports.updateProfileImage = asyncHandler(async (req, res) => {
  const user = await userService.updateProfileImage(
    req.user._id,
    req.file,
    req.log,
  );

  res.status(200).json({
    status: "success",
    data: {
      user,
    },
  });
});
