import { Response } from 'express';
import { AuthRequest } from '../../types/custom';
import { messageService } from './message.service';
import asyncHandle from '../../utils/asyncHandle';
import AppError from '../../utils/appError';

export const sendMessage = asyncHandle(async (req: AuthRequest, res: Response) => {
  const { conversationId, content, messageType, fileUrl, fileName } = req.body;
  
  // Kiểm tra token hợp lệ từ middleware
  if (!req.user?.userId) {
    throw new AppError('Unauthorized', 401); 
  }

  const message = await messageService.sendMessage(
    req.user.userId, 
    conversationId, 
    content, 
    messageType, 
    fileUrl, 
    fileName
  );
  
  res.status(201).json({ success: true, data: message });
});

export const allMessages = asyncHandle(async (req: AuthRequest, res: Response) => {
  // SỬA LỖI TẠI ĐÂY: Ép kiểu req.params.chatId thành string
  const chatId = req.params.chatId as string;
  
  if (!chatId) {
    throw new AppError('Chat ID is required', 400);
  }

  const messages = await messageService.getMessages(chatId);
  res.status(200).json({ success: true, data: messages });
});