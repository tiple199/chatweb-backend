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
      message: "Thiếu Conversation ID",
      data: null
    });
  }

  // Kiểm tra req.user tồn tại
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: "Bạn cần đăng nhập để thực hiện hành động này",
      data: null
    });
  }

  // Tìm cuộc hội thoại trong DB
  const conversation = await ConversationModel.findById(conversationId);
  
  if (!conversation) {
    return res.status(404).json({ 
      success: false, 
      message: "Cuộc hội thoại không tồn tại",
      data: null
    });
  }

  // Kiểm tra quyền truy cập (Dùng trường 'members' theo Model)
  const isMember = conversation.members.some(
    (memberId: any) => memberId.toString() === req.user!.userId
  );

  if (!isMember) {
    return res.status(403).json({ 
      success: false, 
      message: "Bạn không có quyền truy cập hội thoại này",
      data: null
    });
  }

  // Gọi service lấy dữ liệu
  const result = await messageService.getHistoryByConversation(conversationId, page, limit);

  // Validate page không vượt totalPages
  if (page > result.totalPages && result.totalPages > 0) {
    return res.status(400).json({ 
      success: false, 
      message: `Trang không tồn tại. Tối đa ${result.totalPages} trang`,
      data: null
    });
  }

  // Unify response format: tất cả có 'data' wrapper
  res.status(200).json({
    success: true,
    message: "Lấy lịch sử tin nhắn thành công",
    data: result
  });
});