import multer from "multer";
import cloudinary from "../config/cloudinary.js";
import { CloudinaryStorage } from "multer-storage-cloudinary";

// Cloudinary storage configuration for multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // Determine folder based on user type and field
    let folder = "loyalty-hub/uploads";
    
    if (req.user?.userType === "business") {
      folder = "loyalty-hub/business-logos";
    } else if (req.user?.userType === "customer") {
      folder = "loyalty-hub/customer-profiles";
    }

    return {
      folder: folder,
      resource_type: "auto",
      public_id: `${req.user?.id}-${Date.now()}`,
      allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
    };
  },
});

// File filter to only allow image uploads
const fileFilter = (req, file, cb) => {
  const allowedMimes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"), false);
  }
};

export const uploadImage = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
});
