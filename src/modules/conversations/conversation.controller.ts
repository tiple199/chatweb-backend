import { Request, Response } from "express";
import { getUserConversationsService } from "./conversation.service";

export const getUserConversations = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const conversations = await getUserConversationsService(req.user.userId);

    return res.status(200).json(conversations);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch conversations" });
  }
};