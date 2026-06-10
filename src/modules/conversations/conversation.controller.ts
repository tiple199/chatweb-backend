import { Request, Response } from 'express';
import { AuthRequest } from '../../types/custom';
import { conversationService, getUserConversationsService } from './conversation.service';
import { messageService } from '../messages/message.service';
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

// Get polls
export const getPolls = asyncHandle(async (req: AuthRequest, res: Response) => {
  const conversationId = req.params.conversationId as string;
  const polls = await conversationService.getPolls(conversationId);
  res.status(200).json({ success: true, data: polls });
});

// Create a poll in a conversation
export const createPoll = asyncHandle(async (req: AuthRequest, res: Response) => {
  const conversationId = req.params.conversationId as string;
  const question = req.body.Question || req.body.question;
  const options = req.body.Options || req.body.options;
  
  if (!req.user?.userId) throw new AppError('Unauthorized', 401);

  const chat = await conversationService.createPoll(conversationId, question, options, req.user.userId);
  res.status(201).json({ success: true, data: chat });
});

// Vote on a poll
export const votePoll = asyncHandle(async (req: AuthRequest, res: Response) => {
  const pollId = req.params.pollId as string;
  // frontend sends { OptionId: optionId }
  const optionId = req.body.OptionId || req.body.optionId;
  // We need to find conversationId from pollId, or we can just pass the first chat that has this poll.
  // Wait, `votePoll` in service needs `chatId`. 
  // Let's modify service to find by pollId or just find chat containing pollId in controller.
  // Actually, wait, let's look at `votePoll` in service. It expects `chatId`.
  // If we change it to not need chatId, it's easier.
  // Let's find the chat first:
  const { ConversationModel } = require('./conversation.model');
  const chatDoc = await ConversationModel.findOne({ 'polls._id': pollId });
  if (!chatDoc) throw new AppError('Poll not found', 404);
  const chatId = chatDoc._id.toString();
  
  if (!req.user?.userId) throw new AppError('Unauthorized', 401);

  const chat = await conversationService.votePoll(chatId, pollId, optionId, req.user.userId);
  res.status(200).json({ success: true, data: chat });
});

// Get notes
export const getNotes = asyncHandle(async (req: AuthRequest, res: Response) => {
  const conversationId = req.params.conversationId as string;
  const notes = await conversationService.getNotes(conversationId);
  res.status(200).json({ success: true, data: notes });
});

// Create a note
export const createNote = asyncHandle(async (req: AuthRequest, res: Response) => {
  const conversationId = req.params.conversationId as string;
  const content = req.body.Content || req.body.content;
  
  if (!req.user?.userId) throw new AppError('Unauthorized', 401);

  const chat = await conversationService.addNote(conversationId, content, req.user.userId);
  res.status(201).json({ success: true, data: chat });
});

// Update a note
export const updateNote = asyncHandle(async (req: AuthRequest, res: Response) => {
  const noteId = req.params.noteId as string;
  const content = req.body.Content || req.body.content;
  
  const chat = await conversationService.updateNote(noteId, content);
  res.status(200).json({ success: true, data: chat });
});

// Delete a note
export const deleteNote = asyncHandle(async (req: AuthRequest, res: Response) => {
  const noteId = req.params.noteId as string;
  
  const chat = await conversationService.deleteNote(noteId);
  res.status(200).json({ success: true, data: chat });
});

// Update conversation details
export const updateConversation = asyncHandle(async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const data = req.body;
  const requesterId = req.user?.userId;
  
  if (!requesterId) throw new AppError('Unauthorized', 401);

  const chat = await conversationService.updateConversation(id, data, requesterId);
  res.status(200).json({ success: true, data: chat });
});

// Get participants
export const getParticipants = asyncHandle(async (req: AuthRequest, res: Response) => {
  const conversationId = req.params.conversationId as string;
  const requesterId = req.user?.userId;
  
  if (!requesterId) throw new AppError('Unauthorized', 401);

  const participants = await conversationService.getParticipants(conversationId);
  res.status(200).json(participants); // frontend expects raw array based on api definition
});

// Add member to group
export const addMember = asyncHandle(async (req: AuthRequest, res: Response) => {
  const conversationId = req.params.conversationId as string;
  const { userId } = req.body;
  const requesterId = req.user?.userId;
  
  if (!requesterId) throw new AppError('Unauthorized', 401);

  const chat = await conversationService.addMember(conversationId, userId, requesterId);
  res.status(200).json({ success: true, data: chat });
});

// Remove member from group
export const removeMember = asyncHandle(async (req: AuthRequest, res: Response) => {
  const conversationId = req.params.conversationId as string;
  const userId = req.params.userId as string;
  const requesterId = req.user?.userId;
  
  if (!requesterId) throw new AppError('Unauthorized', 401);

  const chat = await conversationService.removeFromGroup(conversationId, userId, requesterId);
  res.status(200).json({ success: true, data: chat });
});

// Mark all messages in a conversation as read
export const markAsRead = asyncHandle(async (req: AuthRequest, res: Response) => {
  const conversationId = req.params.conversationId as string;
  const userId = req.user?.userId;
  
  if (!userId) throw new AppError('Unauthorized', 401);

  const success = await messageService.markMessagesAsRead(conversationId, userId);
  
  if (success) {
    const io = req.app.get('io');
    if (io) {
      io.to(conversationId).emit("messages_read", { conversationId, userId });
    }
  }

  res.status(200).json({ success });
});
