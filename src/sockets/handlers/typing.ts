import type { SocketContext } from "../index";

type TypingPayload = {
  roomId: string;
};

type Ack<T> = (response: { ok: true; data: T } | { ok: false; error: string }) => void;

export const registerTypingHandlers = ({ socket }: SocketContext) => {
  const emitTyping = (
    event: "typing" | "stop_typing",
    payload: TypingPayload,
    ack?: Ack<{ ok: true }>
  ) => {
    const roomId = typeof payload?.roomId === "string" ? payload.roomId.trim() : "";
    if (!roomId) {
      ack?.({ ok: false, error: "Invalid roomId" });
      return;
    }

    if (!socket.rooms.has(roomId)) {
      ack?.({ ok: false, error: "You must join_room first" });
      return;
    }

    socket.to(roomId).emit(event, {
      roomId,
      fromSocketId: socket.id
    });

    ack?.({ ok: true, data: { ok: true } });
  };

  socket.on("typing", (payload: TypingPayload, ack?: Ack<{ ok: true }>) => {
    emitTyping("typing", payload, ack);
  });

  socket.on("stop_typing", (payload: TypingPayload, ack?: Ack<{ ok: true }>) => {
    emitTyping("stop_typing", payload, ack);
  });
};
