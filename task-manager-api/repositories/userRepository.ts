import type { Types } from "mongoose";

import User = require("../models/userModel");

import type { IProfileImage } from "../types/user.types";

// A user ID may come from:
// req.params.id → string
// req.user._id → MongoDB ObjectId
type UserId = string | Types.ObjectId;

// ========================================
// FIND USER BY ID
// ========================================

export const findById = async (userId: UserId) => {
  return User.findById(userId);
};

// ========================================
// FIND ALL USERS
// ========================================

export const findAll = async () => {
  return User.find();
};

// ========================================
// DELETE USER BY ID
// ========================================

export const deleteById = async (userId: UserId) => {
  return User.findByIdAndDelete(userId);
};

// ========================================
// UPDATE PROFILE IMAGE
// ========================================

export const updateProfileImage = async (
  userId: UserId,
  profileImage: IProfileImage,
) => {
  return User.findByIdAndUpdate(
    userId,
    {
      profileImage,
    },
    {
      returnDocument: "after",
      runValidators: true,
    },
  ).select("-password");
};
