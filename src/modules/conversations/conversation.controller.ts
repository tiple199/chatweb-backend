import { Request, Response } from 'express';
import { AuthRequest } from '../../types/custom';
import { conversationService, getUserConversationsService } from './conversation.service';
import asyncHandle from '../../utils/asyncHandle';
import AppError from '../../utils/appError';

// Get all conversations for a user
export const getUserConversations = asyncHandle(async (req: AuthRequest, res: Response) => {
  if (!req.user?.userId) throw new AppError('Unauthorized', 401);

  const conversations = await getUserConversationsService(req.user.userId);
  res.status(200).json({ success: true, data: conversations });
});

// Access or create a direct 1-to-1 chat
export const accessChat = asyncHandle(async (req: AuthRequest, res: Response) => {
  const { targetUserId } = req.body;
  
  if (!req.user?.userId) throw new AppError('Unauthorized', 401); 

  const chat = await conversationService.accessDirectChat(req.user.userId, targetUserId);
  res.status(200).json({ success: true, data: chat });
});

// Create a group chat
export const createGroup = asyncHandle(async (req: AuthRequest, res: Response) => {
  const { chatName, users } = req.body;
  
  if (!req.user?.userId) throw new AppError('Unauthorized', 401);

  const group = await conversationService.createGroupChat(chatName, users, req.user.userId);
  res.status(201).json({ success: true, data: group });
});

// Create a poll in a conversation
export const createPoll = asyncHandle(async (req: AuthRequest, res: Response) => {
  const { chatId, question, options } = req.body;
  
  if (!req.user?.userId) throw new AppError('Unauthorized', 401);

  const chat = await conversationService.createPoll(chatId, question, options, req.user.userId);
  res.status(201).json({ success: true, data: chat });
});

// Vote on a poll
export const votePoll = asyncHandle(async (req: AuthRequest, res: Response) => {
  const { chatId, pollId, optionId } = req.body;
  
  if (!req.user?.userId) throw new AppError('Unauthorized', 401);

  const chat = await conversationService.votePoll(chatId, pollId, optionId, req.user.userId);
  res.status(200).json({ success: true, data: chat });
});
