import { Request, Response } from "express";
import * as messageService from "./messages.service";
import { ConversationModel } from "../conversations/conversation.model";
import asyncHandler from "../../utils/asyncHandle";

export const getHistory = asyncHandler(async (req: Request, res: Response) => {
  const conversationId = req.params.conversationId as string;
  
  // Validate page/limit parameters
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));

  if (!conversationId) {
    return res.status(400).json({ 
      success: false, 
      message: "Missing Conversation ID",
      data: null
    });
  }

  // Kiểm tra req.user tồn tại
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: "You need to login to perform this action",
      data: null
    });
  }

  // Tìm cuộc hội thoại trong DB
  const conversation = await ConversationModel.findById(conversationId);
  
  if (!conversation) {
    return res.status(404).json({ 
      success: false, 
      message: "Conversation does not exist",
      data: null
    });
  }

  // Check access permission (using 'users' field from Model)
  const isMember = conversation.users.some(
    (userId: any) => userId.toString() === req.user!.userId
  );

  if (!isMember) {
    return res.status(403).json({ 
      success: false, 
      message: "You do not have permission to access this conversation",
      data: null
    });
  }

  // Call service to get data
  const result = await messageService.getHistoryByConversation(conversationId, page, limit);

  // Validate page does not exceed totalPages
  if (page > result.totalPages && result.totalPages > 0) {
    return res.status(400).json({ 
      success: false, 
      message: `Page does not exist. Maximum ${result.totalPages} pages`,
      data: null
    });
  }

  // Unify response format with 'data' wrapper
  res.status(200).json({
    success: true,
    message: "Fetched message history successfully",
    data: result
  });
});