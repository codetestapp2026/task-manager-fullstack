const express = require("express");
const {
  getMe,
  getAllUsers,
  deleteUser,
  updateProfileImage,
} = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");
const { restrictTo } = require("../middleware/roleMiddleware");
const { uploadProfileImage } = require("../middleware/uploadMiddleware");
const router = express.Router();

router.get("/", protect, restrictTo("admin"), getAllUsers);
router.delete("/:id", protect, restrictTo("admin"), deleteUser);
// my current user route
router.get("/me", protect, getMe);

// Temporary Multer test route
router.post("/upload-test", uploadProfileImage, (req, res) => {
  res.status(200).json({
    status: "success",
    file: {
      originalname: req.file?.originalname,
      mimetype: req.file?.mimetype,
      size: req.file?.size,
    },
  });
});

// Update profile image
router.patch(
  "/me/profile-image",
  protect,
  uploadProfileImage,
  updateProfileImage,
);

module.exports = router;
