import type { SocketContext } from "../index";

type SeenPayload = {
  roomId: string;
  at?: number;
  messageId?: string;
};

type Ack<T> = (response: { ok: true; data: T } | { ok: false; error: string }) => void;

export const registerSeenHandlers = ({ socket }: SocketContext) => {
  socket.on("seen", (payload: SeenPayload, ack?: Ack<{ ok: true }>) => {
    const roomId = typeof payload?.roomId === "string" ? payload.roomId.trim() : "";
    if (!roomId) {
      ack?.({ ok: false, error: "Invalid roomId" });
      return;
    }

    if (!socket.rooms.has(roomId)) {
      ack?.({ ok: false, error: "You must join_room first" });
      return;
    }

    socket.to(roomId).emit("seen", {
      roomId,
      messageId: typeof payload?.messageId === "string" ? payload.messageId : undefined,
      at: typeof payload?.at === "number" ? payload.at : Date.now(),
      fromSocketId: socket.id
    });

    ack?.({ ok: true, data: { ok: true } });
  });
};
