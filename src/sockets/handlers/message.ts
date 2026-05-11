import type { SocketContext } from "../index";
import { MessageModel } from "../../modules/messages/message.model";

type Ack<T> = (response: { ok: true; data: T } | { ok: false; error: string }) => void;

const MESSAGE_TYPES = ["text", "image", "file"] as const;
type MessageType = (typeof MESSAGE_TYPES)[number];

type SendMessagePayload = {
  conversationId: string;
  content: string;
  type?: string;
};

type EditMessagePayload = {
  conversationId: string;
  messageId: string;
  content: string;
};

type DeleteMessagePayload = {
  conversationId: string;
  messageId: string;
};

type PopulatedSender = {
  _id: string;
  fullName?: string;
  avatar?: string | null;
};

type SocketMessage = {
  _id: string;
  conversationId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  senderId: PopulatedSender;
  type: MessageType;
};

const normalizeId = (value: unknown) => (typeof value === "string" ? value.trim() : "");
const normalizeContent = (value: unknown) => (typeof value === "string" ? value.trim() : "");
const normalizeMessageType = (value: unknown): MessageType => {
  return MESSAGE_TYPES.includes(value as MessageType) ? (value as MessageType) : "text";
};

const requireJoinedRoom = (socketId: string, socketRooms: ReadonlySet<string>, roomId: string) => {
  // socket.rooms always includes its own socket.id; treat joining a room as explicit membership.
  return roomId !== socketId && socketRooms.has(roomId);
};

export const registerMessageHandlers = ({ io, socket }: SocketContext) => {
  socket.on(
    "send_message",
    async (payload: SendMessagePayload, ack?: Ack<{ message: SocketMessage }>) => {
      const conversationId = normalizeId(payload?.conversationId);
      const content = normalizeContent(payload?.content);
      const authenticatedUser = socket.data?.user as {
        userId?: string;
        fullName?: string;
        avatar?: string | null;
        email?: string;
      } | undefined;
      const senderId = normalizeId(authenticatedUser?.userId);
      const messageType = normalizeMessageType(payload?.type);

      if (!conversationId) {
        ack?.({ ok: false, error: "Invalid conversationId" });
        return;
      }
      if (!requireJoinedRoom(socket.id, socket.rooms, conversationId)) {
        ack?.({ ok: false, error: "You must join_room first" });
        return;
      }
      if (!content || content.length > 2000) {
        ack?.({ ok: false, error: "Invalid content" });
        return;
      }
      if (!senderId) {
        ack?.({ ok: false, error: "Unauthorized" });
        return;
      }

      try {
        const newMessage = await MessageModel.create({
          conversationId,
          senderId,
          content,
          type: messageType
        });

        const messageObject = newMessage.toObject() as unknown as {
          _id: { toString: () => string };
          conversationId: { toString: () => string };
          content: string;
          type: MessageType;
          createdAt: Date | string;
          updatedAt: Date | string;
        };

        const message: SocketMessage = {
          _id: messageObject._id.toString(),
          conversationId: messageObject.conversationId.toString(),
          content: messageObject.content,
          senderId: {
            _id: senderId,
            fullName: authenticatedUser?.fullName,
            avatar: authenticatedUser?.avatar ?? null
          },
          createdAt: new Date(messageObject.createdAt).toISOString(),
          updatedAt: new Date(messageObject.updatedAt).toISOString(),
          type: messageObject.type
        };

        io.to(conversationId).emit("receive_message", message);
        ack?.({ ok: true, data: { message } });
      } catch (error) {
        console.error("Lỗi khi gửi tin nhắn:", error);
        ack?.({ ok: false, error: "Không thể gửi tin nhắn" });
      }
    }
  );

  socket.on(
    "edit_message",
    (payload: EditMessagePayload, ack?: Ack<{ messageId: string; updatedAt: string }>) => {
      const conversationId = normalizeId(payload?.conversationId);
      const messageId = normalizeId(payload?.messageId);
      const content = normalizeContent(payload?.content);

      if (!conversationId || !messageId) {
        ack?.({ ok: false, error: "Invalid conversationId/messageId" });
        return;
      }
      if (!requireJoinedRoom(socket.id, socket.rooms, conversationId)) {
        ack?.({ ok: false, error: "You must join_room first" });
        return;
      }
      if (!content || content.length > 2000) {
        ack?.({ ok: false, error: "Invalid content" });
        return;
      }

      const updatedAt = new Date().toISOString();

      // Broadcast to others in the room; sender can update optimistically via ack.
      socket.to(conversationId).emit("edit_message", {
        conversationId,
        messageId,
        content,
        updatedAt
      });

      ack?.({ ok: true, data: { messageId, updatedAt } });
    }
  );

  socket.on(
    "delete_message",
    (payload: DeleteMessagePayload, ack?: Ack<{ messageId: string }>) => {
      const conversationId = normalizeId(payload?.conversationId);
      const messageId = normalizeId(payload?.messageId);

      if (!conversationId || !messageId) {
        ack?.({ ok: false, error: "Invalid conversationId/messageId" });
        return;
      }
      if (!requireJoinedRoom(socket.id, socket.rooms, conversationId)) {
        ack?.({ ok: false, error: "You must join_room first" });
        return;
      }

      socket.to(conversationId).emit("delete_message", {
        conversationId,
        messageId
      });

      ack?.({ ok: true, data: { messageId } });
    }
  );
};
