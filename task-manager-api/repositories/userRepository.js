const User = require("../models/userModel");

const findById = async (userId) => {
  return User.findById(userId);
};

const findAll = async () => {
  return User.find();
};

const deleteById = async (userId) => {
  return User.findByIdAndDelete(userId);
};

const updateProfileImage = async (userId, profileImage) => {
  return User.findByIdAndUpdate(
    userId,
    {
      profileImage,
    },
    {
      new: true,
      runValidators: true,
    },
  ).select("-password");
};

module.exports = {
  findById,
  findAll,
  deleteById,
  updateProfileImage,
};
