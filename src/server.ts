import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import { app } from "./app";
import { connectDB } from "./config/db";
import { initSockets } from "./sockets";

dotenv.config();

const startServer = async () => {
  try {
    await connectDB();
    console.log("Database connected successfully");

    const server = http.createServer(app);

    const io = new Server(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

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
