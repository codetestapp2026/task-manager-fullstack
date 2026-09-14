const userRepository = require("../repositories/userRepository");
const cloudinaryService = require("./cloudinaryService");
const AppError = require("../utils/appError");

const getAllUsers = async () => {
  return userRepository.findAll();
};

const deleteUser = async (userId) => {
  const user = await userRepository.deleteById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return user;
};

// PROFILE IMAGE
const updateProfileImage = async (userId, file, log) => {
  if (!file) {
    throw new AppError("Please upload an image.", 400);
  }

  const user = await userRepository.findById(userId);

  if (!user) {
    throw new AppError("User not found.", 404);
  }

  const oldPublicId = user.profileImage?.publicId;
  const uploaded = await cloudinaryService.uploadImage(file.buffer);
  let updatedUser;

  try {
    updatedUser = await userRepository.updateProfileImage(userId, {
      url: uploaded.secure_url,
      publicId: uploaded.public_id,
    });
  } catch (error) {
    try {
      await cloudinaryService.deleteImage(uploaded.public_id);
    } catch (cleanupError) {
      log?.error(
        {
          userId,
          err: cleanupError,
        },
        "Failed to clean up uploaded image",
      );
    }

    throw error;
  }

  if (oldPublicId) {
    try {
      await cloudinaryService.deleteImage(oldPublicId);
    } catch (error) {
      log?.warn(
        {
          userId,
          oldPublicId,
          err: error,
        },
        "Failed to delete old profile image",
      );
    }
  }

  return updatedUser;
};

module.exports = {
  getAllUsers,
  deleteUser,
  updateProfileImage,
};
