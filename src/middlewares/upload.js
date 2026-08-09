import cloudinary from "../config/cloudinary.js";

const getResourceType = (mimeType) => {
  if (mimeType === "application/pdf") {
    return "raw";
  }

  if (
    mimeType === "image/jpeg" ||
    mimeType === "image/png"
  ) {
    return "image";
  }

  throw new Error(`Unsupported file type: ${mimeType}`);
};

const generatePublicId = (userId, isPublic) => {
  const timestamp = Date.now();

  const randomString = Math.random()
    .toString(36)
    .substring(2, 15);

  const folder = isPublic
    ? `${userId}/public`
    : `${userId}/documents`;

  return `${folder}/${timestamp}-${randomString}`;
};

export const uploadToCloudinary = async (
  file,
  userId,
  isPublic = false
) => {
  try {
    const resourceType = getResourceType(file.mimetype);

    const publicId = generatePublicId(
      userId,
      isPublic
    );

    const result = await new Promise((resolve, reject) => {
      const uploadStream =
        cloudinary.uploader.upload_stream(
          {
            public_id: publicId,

            resource_type: resourceType,

            type: isPublic
              ? "upload"
              : "authenticated",

            context: {
              originalName: file.originalname,
              userId: userId.toString(),
            },
          },

          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          }
        );

      uploadStream.end(file.buffer);
    });

    return {
      publicId: result.public_id,
      resourceType: result.resource_type,
      format: result.format,
      size: file.size,
      secureUrl: result.secure_url,
      version: result.version,
      originalName: file.originalname,
      mimeType: file.mimetype,
    };
  } catch (error) {
    console.error(
      "Cloudinary upload error:",
      error
    );

    throw new Error(
      `Failed to upload file: ${error.message}`
    );
  }
};

export const generateSignedUrl = (
  publicId,
  resourceType
) => {
  return cloudinary.url(publicId, {
    resource_type: resourceType,
    type: "authenticated",
    secure: true,
    sign_url: true,
  });
};

export const generatePdfDownloadUrl = (
  publicId
) => {
  return cloudinary.utils.private_download_url(
    publicId,
    "pdf",
    {
      resource_type: "raw",
      type: "authenticated",
      attachment: true,
    }
  );
};