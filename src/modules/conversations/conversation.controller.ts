import { Response } from 'express';
import { AuthRequest } from '../../types/custom';
import { conversationService } from './conversation.service';
import asyncHandle from '../../utils/asyncHandle';
import AppError from '../../utils/appError';

//[cite: 7] errorHandler sẽ tự động bắt các lỗi ném ra bởi throw new AppError
export const accessChat = asyncHandle(async (req: AuthRequest, res: Response) => {
  const { targetUserId } = req.body;
  
  //[cite: 8] req.user chứa userId và email từ jwt.middleware.ts
  if (!req.user?.userId) throw new AppError('Unauthorized', 401); 

  const chat = await conversationService.accessDirectChat(req.user.userId, targetUserId);
  res.status(200).json({ success: true, data: chat });
});

export const createGroup = asyncHandle(async (req: AuthRequest, res: Response) => {
  const { chatName, users } = req.body;
  
  if (!req.user?.userId) throw new AppError('Unauthorized', 401);

  const group = await conversationService.createGroupChat(chatName, users, req.user.userId);
  res.status(201).json({ success: true, data: group });
});

export const createPoll = asyncHandle(async (req: AuthRequest, res: Response) => {
  const { chatId, question, options } = req.body;
  
  if (!req.user?.userId) throw new AppError('Unauthorized', 401);

  const chat = await conversationService.createPoll(chatId, question, options, req.user.userId);
  res.status(201).json({ success: true, data: chat });
});

export const votePoll = asyncHandle(async (req: AuthRequest, res: Response) => {
  const { chatId, pollId, optionId } = req.body;
  
  if (!req.user?.userId) throw new AppError('Unauthorized', 401);

  const chat = await conversationService.votePoll(chatId, pollId, optionId, req.user.userId);
  res.status(200).json({ success: true, data: chat });
});