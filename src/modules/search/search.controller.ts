import { Request, Response } from "express";
import { searchService } from "./search.service";

export const search = async (
  req: Request,
  res: Response
) => {
  try {
    const keyword =
      (req.query.q as string) || "";

    const conversationId =
      req.query.conversationId as
        | string
        | undefined;

    const type =
      req.query.type as
        | string
        | undefined;

    const senderId =
      req.query.senderId as
        | string
        | undefined;

    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized"
      });
    }

    const result = await searchService(
      keyword,
      req.user.userId,
      conversationId,
      type,
      senderId
    );

    return res.json({
      success: true,
      data: result
    });
  } catch (err) {
    return res.status(500).json({
      message: "Search failed"
    });
  }
};