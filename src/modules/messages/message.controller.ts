import { Response } from 'express';
import { AuthRequest } from '../../types/custom';
import { messageService } from './message.service';
import asyncHandle from '../../utils/asyncHandle';
import AppError from '../../utils/appError';
import { Server } from "socket.io";
import { ConversationModel } from "../conversations/conversation.model";
import mongoose from "mongoose";

export const sendMessage = asyncHandle(async (req: AuthRequest, res: Response) => {
  const { ConversationId, Content } = req.body;
  
  if (!req.user?.userId) {
    throw new AppError('Unauthorized', 401); 
  }

  const conversationId = ConversationId || req.body.conversationId;
  const content = Content || req.body.content || "";

  if (!conversationId) {
    throw new AppError('Conversation ID is required', 400);
  }

  if (!mongoose.Types.ObjectId.isValid(conversationId)) {
    throw new AppError('Invalid Conversation ID', 400);
  }

  const conversation = await ConversationModel.findById(conversationId);
  if (!conversation) {
    throw new AppError('Conversation does not exist', 404);
  }

  const isMember = conversation.users.some(
    (userId: any) => userId.toString() === req.user!.userId
  );
  if (!isMember) {
    throw new AppError('You do not have permission to access this conversation', 403);
  }

  if (!content.trim() && !req.file) {
    throw new AppError('Message content is required', 400);
  }

  let messageType: 'text' | 'image' | 'video' | 'file' = 'text';
  let fileUrl: string | undefined;
  let fileName: string | undefined;
  let fileSize: number | undefined;
  let mimeType: string | undefined;

  if (req.file) {
    mimeType = req.file.mimetype;
    fileName = req.file.originalname;
    fileSize = req.file.size;
    fileUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    
    if (mimeType.startsWith("image/")) {
      messageType = "image";
    } else if (mimeType.startsWith("video/")) {
      messageType = "video";
    } else {
      messageType = "file";
    }
  }

  const message = await messageService.sendMessage(
    req.user.userId, 
    conversationId, 
    content, 
    messageType, 
    fileUrl,
    fileName,
    fileSize,
    mimeType
  );

  // Emit qua socket
  const io: Server = req.app.get("io");
  if (io) {
    const messageObject = message.toObject() as any;
    const socketMessage = {
      _id: messageObject._id.toString(),
      conversationId: messageObject.conversationId.toString(),
      content: messageObject.content,
      sender: {
        _id: messageObject.sender._id.toString(),
        fullName: messageObject.sender.fullName,
        avatar: messageObject.sender.avatar ?? null
      },
      createdAt: new Date(messageObject.createdAt).toISOString(),
      updatedAt: new Date(messageObject.updatedAt).toISOString(),
      messageType: messageObject.messageType,
      fileUrl: messageObject.fileUrl,
      fileName: messageObject.fileName,
      fileSize: messageObject.fileSize,
      mimeType: messageObject.mimeType,
    };
    io.to(conversationId.toString()).emit("receive_message", socketMessage);
  }
  
  res.status(201).json({ success: true, data: message });
});

export const getHistory = asyncHandle(async (req: AuthRequest, res: Response) => {
  const conversationId = req.params.conversationId as string;
  
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));

  if (!conversationId) {
    throw new AppError('Conversation ID is required', 400);
  }

  if (!mongoose.Types.ObjectId.isValid(conversationId)) {
    throw new AppError('Invalid Conversation ID', 400);
  }

  if (!req.user?.userId) {
    throw new AppError('Unauthorized', 401); 
  }

  const conversation = await ConversationModel.findById(conversationId);
  if (!conversation) {
    throw new AppError('Conversation does not exist', 404);
  }

  const isMember = conversation.users.some(
    (userId: any) => userId.toString() === req.user!.userId
  );

  if (!isMember) {
    throw new AppError('You do not have permission to access this conversation', 403);
  }

  const result = await messageService.getHistory(conversationId, page, limit);

  if (page > result.totalPages && result.totalPages > 0) {
    throw new AppError(`Page does not exist. Maximum ${result.totalPages} pages`, 400);
  }

  res.status(200).json({
    success: true,
    message: "Fetched message history successfully",
    data: result
  });
});

export const searchMessages = asyncHandle(async (req: AuthRequest, res: Response) => {
  const conversationId = req.query.ConversationId as string;
  const keyword = req.query.keyword as string;
  const messageType = req.query.MessageType as string;

  if (!conversationId) {
    throw new AppError('Conversation ID is required for search', 400);
  }

  if (!mongoose.Types.ObjectId.isValid(conversationId)) {
    throw new AppError('Invalid Conversation ID', 400);
  }

  if (!req.user?.userId) {
    throw new AppError('Unauthorized', 401); 
  }

  const conversation = await ConversationModel.findById(conversationId);
  if (!conversation) {
    throw new AppError('Conversation does not exist', 404);
  }

  const isMember = conversation.users.some(
    (userId: any) => userId.toString() === req.user!.userId
  );

  if (!isMember) {
    throw new AppError('You do not have permission to access this conversation', 403);
  }

  const messages = await messageService.searchMessages(conversationId, keyword, messageType);

  res.status(200).json({ success: true, data: messages });
});