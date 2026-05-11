import jwt from "jsonwebtoken";
import type { Server, Socket } from "socket.io";
import { registerMessageHandlers } from "./handlers/message";
import { registerRoomHandlers } from "./handlers/room";
import { registerSeenHandlers } from "./handlers/seen";
import { registerTypingHandlers } from "./handlers/typing";

type SocketUser = {
  userId: string;
  fullName?: string;
  avatar?: string | null;
  email?: string;
};

export type SocketContext = {
  io: Server;
  socket: Socket;
};

export const initSockets = (io: Server) => {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token || typeof token !== "string") {
      next(new Error("Missing token"));
      return;
    }

    if (!process.env.JWT_SECRET) {
      next(new Error("JWT secret is not configured"));
      return;
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET) as SocketUser;

      if (!decoded?.userId) {
        next(new Error("Invalid token"));
        return;
      }

      socket.data.user = {
        userId: decoded.userId,
        fullName: decoded.fullName,
        avatar: decoded.avatar ?? null,
        email: decoded.email
      } satisfies SocketUser;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.data.user?.userId);

     socket.on("disconnect", () => {
      console.log("Disconnected:", socket.data.user?.userId);
    });


    const ctx: SocketContext = { io, socket };

    registerRoomHandlers(ctx);
    registerMessageHandlers(ctx);
    registerTypingHandlers(ctx);
    registerSeenHandlers(ctx);
  });
};
