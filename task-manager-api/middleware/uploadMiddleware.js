const multer = require("multer");

// Store uploaded image in memory
const storage = multer.memoryStorage();

// add validation
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

  if (allowedTypes.includes(file.mimetype)) {
    return cb(null, true);
  }

  cb(new AppError("Only JPEG, PNG, and WEBP images are allowed.", 400));
};
// Create multer upload object
const upload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter,
});

// Accept one file with field name "image"
const uploadProfileImage = upload.single("image");

// Export middleware
module.exports = {
  uploadProfileImage,
};
