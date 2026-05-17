import type { SocketContext } from "../index";

type JoinRoomPayload = {
  roomId: string;
};

type LeaveRoomPayload = {
  roomId: string;
};

type Ack<T> = (response: { ok: true; data: T } | { ok: false; error: string }) => void;

const normalizeRoomId = (roomId: unknown) => (typeof roomId === "string" ? roomId.trim() : "");

export const registerRoomHandlers = ({ socket }: SocketContext) => {
  socket.on("join_room", (payload: JoinRoomPayload, ack?: Ack<{ roomId: string }>) => {
    const roomId = normalizeRoomId(payload?.roomId);
    if (!roomId) {
      ack?.({ ok: false, error: "Invalid roomId" });
      return;
    }

    socket.join(roomId);
    ack?.({ ok: true, data: { roomId } });
  });

  socket.on("leave_room", (payload: LeaveRoomPayload, ack?: Ack<{ roomId: string }>) => {
    const roomId = normalizeRoomId(payload?.roomId);
    if (!roomId) {
      ack?.({ ok: false, error: "Invalid roomId" });
      return;
    }

    socket.leave(roomId);
    ack?.({ ok: true, data: { roomId } });
  });
};
