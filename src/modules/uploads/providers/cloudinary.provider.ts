const streamifier = require("streamifier") as {
  createReadStream: (buffer: Buffer) => NodeJS.ReadableStream;
};
import { UploadArtifact, UploadFile, UploadOptions, UploadProvider } from "../upload.types";

const getCloudinary = () => {
  const cloudinary = require("cloudinary");
  return cloudinary.v2;
};

const getCloudinaryConfig = () => ({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export class CloudinaryUploadProvider implements UploadProvider {
  constructor() {
    const cloudinary = getCloudinary();
    cloudinary.config(getCloudinaryConfig());
  }

  async upload(file: UploadFile, options: UploadOptions): Promise<UploadArtifact> {
    const cloudinary = getCloudinary();

    const result = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: options.folder,
          resource_type: options.resourceType,
          public_id: options.publicIdPrefix,
        },
        (error: unknown, uploaded: any) => {
          if (error) {
            reject(error);
            return;
          }

          resolve(uploaded);
        }
      );

      const buffer = file.buffer;
      if (!buffer) {
        reject(new Error("Uploaded file is missing buffer data."));
        return;
      }

      streamifier.createReadStream(buffer).pipe(uploadStream);
    });

    return {
      provider: "cloudinary",
      url: result.secure_url,
      storageKey: result.public_id,
      folder: options.folder,
      resourceType: options.resourceType,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    };
  }

  async delete(artifact: UploadArtifact): Promise<void> {
    const cloudinary = getCloudinary();
    await cloudinary.uploader.destroy(artifact.storageKey, {
      resource_type: artifact.resourceType,
    });
  }
}
