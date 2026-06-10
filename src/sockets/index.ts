import type { Server, Socket } from "socket.io";
import { registerMessageHandlers } from "./handlers/message";
import { registerRoomHandlers } from "./handlers/room";
import { registerSeenHandlers } from "./handlers/seen";
import { registerTypingHandlers } from "./handlers/typing";

export type SocketContext = {
  io: Server;
  socket: Socket;
};

export const initSockets = (io: Server) => {
  console.log("Initializing legacy socket handlers...");

  io.on("connection", (socket) => {
    console.log("Client connected (Legacy Handler):", socket.data?.userId);

    // Lưu ý: User join room (userId) đã được xử lý trong RealtimeMediator

    const ctx: SocketContext = { io, socket };

    registerRoomHandlers(ctx);
    registerMessageHandlers(ctx);
    // registerTypingHandlers(ctx); // Đã chuyển sang Mediator
    // registerSeenHandlers(ctx); // Đã chuyển sang Mediator

    socket.on("disconnect", (reason) => {
      console.log("Client disconnected:", socket.data?.userId, reason);
    });
  });
};

