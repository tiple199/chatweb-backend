import type { SocketContext } from "../index";
import { messageService } from "../../modules/messages/message.service";
import { ConversationModel } from "../../modules/conversations/conversation.model";

type Ack<T> = (response: { ok: true; data: T } | { ok: false; error: string }) => void;

type SendMessagePayload = {
  conversationId: string;
  content: string;
  type?: "text" | "image" | "file";
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
  type: "text" | "image" | "file";
};

const normalizeId = (value: unknown) => (typeof value === "string" ? value.trim() : "");
const normalizeContent = (value: unknown) => (typeof value === "string" ? value.trim() : "");

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
      const senderId = normalizeId(socket.data?.userId);

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
        const conversation = await ConversationModel.findById(conversationId);
        if (!conversation) {
          ack?.({ ok: false, error: "Conversation not found" });
          return;
        }

        const isMember = conversation.users.some(
          (userId: any) => userId.toString() === senderId
        );
        if (!isMember) {
          ack?.({ ok: false, error: "Unauthorized" });
          return;
        }

        const populatedMessage = await messageService.sendMessage(
          senderId,
          conversationId,
          content,
          payload.type || "text"
        );

        const messageObject = populatedMessage.toObject() as any;

        const message: SocketMessage = {
          _id: messageObject._id.toString(),
          conversationId: messageObject.conversationId.toString(),
          content: messageObject.content,
          senderId: {
            _id: messageObject.sender._id.toString(),
            fullName: messageObject.sender.fullName,
            avatar: messageObject.sender.avatar ?? null
          },
          createdAt: new Date(messageObject.createdAt).toISOString(),
          updatedAt: new Date(messageObject.updatedAt).toISOString(),
          type: messageObject.messageType
        };

        // Note: RealtimeMediator will handle the broadcast via EventBus
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
