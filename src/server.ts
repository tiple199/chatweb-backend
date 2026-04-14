import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import { app } from "./app";
import { connectDB } from "./config/db";

dotenv.config();

const startServer = async () => {
  await connectDB();

  const server = http.createServer(app);

  const io = new Server(server, {
    cors: {
      origin: "*"
    }
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("join_conversation", (conversationId: string) => {
      socket.join(conversationId);
    });

    socket.on("send_message", async (payload) => {
      io.to(payload.conversationId).emit("receive_message", payload);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  const port = Number(process.env.PORT) || 5000;
  server.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
};

startServer().catch((error) => {
  console.error(error);
  process.exit(1);
});