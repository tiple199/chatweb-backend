import { Server, Socket } from "socket.io";
import { eventBus, EVENTS } from "../core/event-bus";
import { socketServer } from "../core/socket";
import { logger } from "../core/logger";

export class RealtimeMediator {
  private static instance: RealtimeMediator;
  private io!: Server;

  private constructor() {
    // io will be initialized in initialize()
  }

  public static getInstance(): RealtimeMediator {
    if (!RealtimeMediator.instance) {
      RealtimeMediator.instance = new RealtimeMediator();
    }
    return RealtimeMediator.instance;
  }

  public initialize() {
    this.io = socketServer.getIO();
    logger.info("RealtimeMediator initialized. Subscribing to events...");

    // Subscriber: Lắng nghe Event từ EventBus (Observer)
    eventBus.on(EVENTS.MESSAGE_CREATED, this.handleMessageCreated.bind(this));
    
    // Ở đây ta có thể mở rộng lắng nghe thêm các sự kiện khác:
    // eventBus.on(EVENTS.MESSAGE_DELETED, this.handleMessageDeleted.bind(this));
    // eventBus.on(EVENTS.USER_ONLINE, this.handleUserOnline.bind(this));

    // Xử lý các sự kiện đến từ Socket Client
    this.io.on("connection", (socket: Socket) => {
      // (Ví dụ) Nếu user kết nối thành công, join họ vào các room tương ứng
      const userId = socket.data?.userId;
      if (userId) {
        socket.join(userId);
      }

      // Ủy quyền cho mediator điều phối
      socket.on("typing", (data) => this.handleTyping(socket, data));
      socket.on("seen", (data) => this.handleSeen(socket, data));
    });
  }

  // Phương thức phản hồi cho EVENT.MESSAGE_CREATED
  private handleMessageCreated(message: any) {
    if (!message || !message.conversationId) return;
    
    const messageObject = message.toObject ? message.toObject() : message;
    
    const socketMessage = {
      _id: messageObject._id?.toString(),
      conversationId: messageObject.conversationId?.toString(),
      content: messageObject.content,
      sender: messageObject.sender ? {
        _id: messageObject.sender._id?.toString(),
        fullName: messageObject.sender.fullName,
        avatar: messageObject.sender.avatar ?? null
      } : null,
      createdAt: messageObject.createdAt ? new Date(messageObject.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: messageObject.updatedAt ? new Date(messageObject.updatedAt).toISOString() : new Date().toISOString(),
      messageType: messageObject.messageType,
      fileUrl: messageObject.fileUrl,
      fileName: messageObject.fileName,
      fileSize: messageObject.fileSize,
      mimeType: messageObject.mimeType,
    };

    // Mediator ra lệnh cho Socket Server phát data
    this.io.to(socketMessage.conversationId as string).emit("receive_message", socketMessage);
    logger.info(`Mediator: broadcasted MESSAGE_CREATED to room ${socketMessage.conversationId}`);
  }

  // Các phương thức phản hồi sự kiện từ Socket Client
  private handleTyping(socket: Socket, data: any) {
    if (data?.conversationId) {
      socket.to(data.conversationId).emit("typing", data);
    }
  }

  private handleSeen(socket: Socket, data: any) {
    if (data?.conversationId) {
      socket.to(data.conversationId).emit("seen", data);
    }
  }
}

export const realtimeMediator = RealtimeMediator.getInstance();
