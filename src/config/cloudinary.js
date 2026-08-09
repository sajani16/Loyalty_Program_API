import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log(
  `[Cloudinary Config] Cloud: ${process.env.CLOUDINARY_CLOUD_NAME}`
);

export const CLOUDINARY_CONFIG = {
  maxFileSize: 50 * 1024 * 1024,
};

export default cloudinary;