export type DmMessage = {
  roomId: string;
  from: string;
  text: string;
  at: number;
};

export const createDmMessage = (params: { roomId: string; from: string; text: string }): DmMessage => {
  return {
    roomId: params.roomId,
    from: params.from,
    text: params.text,
    at: Date.now()
  };
};
