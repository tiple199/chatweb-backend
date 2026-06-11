import http from "http";
import dotenv from "dotenv";
import { app } from "./app";
import { database } from "./core/database";
import { socketServer } from "./core/socket";
import { logger } from "./core/logger";
import { realtimeMediator } from "./mediator/realtime.mediator";
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
    // 1. Kết nối Database qua Singleton
    await database.connect();

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

    // 2. Khởi tạo Socket qua Singleton
    const io = socketServer.init(server);

    // 3. Khởi tạo Mediator (Observer Subscriber)
    realtimeMediator.initialize();

    // (Backward compatibility) Vẫn gán io vào app cho các file chưa migrate
    app.set("io", io);

    // (Backward compatibility) Khởi tạo các socket handlers cũ
    initSockets(io);

    const port = Number(process.env.PORT) || 5000;
    server.listen(port, () => {
      logger.info(`Server running on port ${port}`);
    });

  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
