import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { logger } from "./logger";
import jwt from "jsonwebtoken";

export class SocketServer {
  private static instance: SocketServer;
  private io: Server | null = null;

  private constructor() {}

  public static getInstance(): SocketServer {
    if (!SocketServer.instance) {
      SocketServer.instance = new SocketServer();
    }
    return SocketServer.instance;
  }

  public init(server: HttpServer): Server {
    if (!this.io) {
      this.io = new Server(server, {
        cors: {
          origin: "*",
          methods: ["GET", "POST"]
        }
      });
      
      this.setupAuthentication();
      logger.info("Socket.IO initialized and secured.");
    }
    return this.io;
  }

  private setupAuthentication() {
    if (!this.io) return;
    
    this.io.use((socket: Socket, next) => {
      const token = socket.handshake.auth?.token;

      if (!token || typeof token !== "string") {
        return next(new Error("Missing token"));
      }

      if (!process.env.JWT_SECRET) {
        return next(new Error("JWT secret is not configured"));
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET) as { userId?: string };

        if (!decoded?.userId) {
          return next(new Error("Invalid token"));
        }

        socket.data.userId = decoded.userId;
        next();
      } catch {
        next(new Error("Invalid token"));
      } 
    });
  }

  public getIO(): Server {
    if (!this.io) {
      throw new Error("Socket.IO is not initialized. Call init() first.");
    }
    return this.io;
  }
}

export const socketServer = SocketServer.getInstance();

