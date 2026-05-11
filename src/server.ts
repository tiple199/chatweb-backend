import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import { app } from "./app";
import { connectDB } from "./config/db";
import { chatSocket } from "./sockets/chat.socket"; // Import hàm socket của bạn

dotenv.config();

const startServer = async () => {
  try {
    // 1. Kết nối Cơ sở dữ liệu MongoDB
    await connectDB();
    console.log("Database connected successfully");

    // 2. Tạo HTTP Server từ Express App
    const server = http.createServer(app);

    // 3. Khởi tạo Socket.IO với cấu hình CORS
    const io = new Server(server, {
      cors: {
        origin: "*", // Trong thực tế nên để FRONTEND_URL từ .env
        methods: ["GET", "POST"]
      }
    });

    // 4. Kích hoạt logic Chat Real-time và lưu lịch sử
    chatSocket(io);

    // 5. Lắng nghe tại cổng chỉ định
    const port = Number(process.env.PORT) || 5000;
    server.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });

  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

// Khởi chạy hệ thống
startServer();