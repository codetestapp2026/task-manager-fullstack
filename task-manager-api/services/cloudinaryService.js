
const { PassThrough } = require("node:stream");

const cloudinary = require("../config/cloudinary");

const uploadImage = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadStream =
      cloudinary.uploader.upload_stream(
        {
          resource_type: "image",
          folder: "task-manager/profile-images",
          ...options
        },
        (error, result) => {
          if (error) {
            return reject(error);
          }

          resolve(result);
        }
      );

    const bufferStream = new PassThrough();

    bufferStream.end(buffer);

    bufferStream.pipe(uploadStream);
  });
};

const deleteImage = async (publicId) => {
  return cloudinary.uploader.destroy(publicId);
};

module.exports = {
  uploadImage,
  deleteImage
};
