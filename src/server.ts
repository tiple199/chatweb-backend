import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import { app } from "./app";
import { connectDB } from "./config/db";
import { initSockets } from "./sockets";

dotenv.config();

const getUploadProviderName = (value?: string) => {
  const normalized = value?.trim().toLowerCase();
  return normalized === "cloudinary" ? "cloudinary" : "local";
};

const hasCloudinaryCredentials = () => {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
};

const startServer = async () => {
  try {
    await connectDB();
    console.log("Database connected successfully");

    const globalUploadProvider = getUploadProviderName(process.env.UPLOAD_PROVIDER);
    const avatarUploadProvider = getUploadProviderName(process.env.AVATAR_UPLOAD_PROVIDER ?? process.env.UPLOAD_PROVIDER);
    const attachmentUploadProvider = getUploadProviderName(process.env.ATTACHMENT_UPLOAD_PROVIDER ?? process.env.UPLOAD_PROVIDER);

    console.log(
      `[Upload] global=${globalUploadProvider}, avatar=${avatarUploadProvider}, attachment=${attachmentUploadProvider}, cloudinaryKeys=${hasCloudinaryCredentials() ? "present" : "missing"}`
    );

    if (
      [globalUploadProvider, avatarUploadProvider, attachmentUploadProvider].includes("cloudinary") &&
      !hasCloudinaryCredentials()
    ) {
      console.warn("[Upload] Cloudinary is selected but one or more credentials are missing.");
    }

    const server = http.createServer(app);

    const io = new Server(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    app.set("io", io);

    initSockets(io);

    const port = Number(process.env.PORT) || 5000;
    server.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });

  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
