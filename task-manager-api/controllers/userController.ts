import asyncHandler = require("express-async-handler");

import type { Request, Response } from "express";

import * as userService from "../services/userService";

// ========================================
// REQUEST TYPES
// ========================================

type UserParams = {
  id: string;
};

type DeleteUserRequest = Request<UserParams>;

// ========================================
// GET CURRENT USER
// ========================================

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  res.status(200).json({
    status: "success",

    data: {
      user: req.user,
    },
  });
});

// ========================================
// ADMIN TEST
// ========================================

export const adminTest = asyncHandler(async (req: Request, res: Response) => {
  res.status(200).json({
    status: "success",
    message: "Welcome Admin",
  });
});

// ========================================
// GET ALL USERS
// ========================================

export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  const users = await userService.getAllUsers();

  if (users.length === 0) {
    res.status(200).json({
      status: "success",
      message: "No users found",
      results: 0,

      data: {
        users: [],
      },
    });

    return;
  }

  res.status(200).json({
    status: "success",
    results: users.length,

    data: {
      users,
    },
  });
});

// ========================================
// DELETE USER
// ========================================

export const deleteUser = asyncHandler(
  async (req: DeleteUserRequest, res: Response) => {
    await userService.deleteUser(req.params.id);

    res.status(200).json({
      status: "success",
      message: "User deleted successfully",
    });
  },
);

// ========================================
// UPDATE PROFILE IMAGE
// ========================================

export const updateProfileImage = asyncHandler(
  async (req: Request, res: Response) => {
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
  },
);
