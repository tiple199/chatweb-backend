import { Response } from 'express';
import { AuthRequest } from '../../types/custom';
import { messageService } from './message.service';
import asyncHandle from '../../utils/asyncHandle';
import AppError from '../../utils/appError';
import { attachmentUploadService } from "../uploads/attachment-upload.service";
import fs from 'fs';

export const sendMessage = asyncHandle(async (req: AuthRequest, res: Response) => {
  // Lấy dữ liệu đã được làm sạch từ RequestHandler Pipeline
  const conversationId = (req as any).conversationId;
  const content = (req as any).content;
  
  let messageType: 'text' | 'image' | 'video' | 'file' = 'text';
  let fileUrl: string | undefined;
  let fileProvider: string | undefined;
  let filePublicId: string | undefined;
  let fileName: string | undefined;
  let fileSize: number | undefined;
  let mimeType: string | undefined;

  if (req.file) {
    // Ensure we provide an UploadFile shape with required buffer
    const file = req.file as any;
    let buffer: Buffer;
    if (file.buffer) {
      buffer = file.buffer as Buffer;
    } else if (file.path) {
      buffer = await fs.promises.readFile(file.path);
    } else {
      throw new AppError('Uploaded file has no buffer or path', 400);
    }

    const uploadArg = {
      buffer,
      originalname: file.originalname || file.filename,
      mimetype: file.mimetype,
      size: file.size,
    } as any;

    const uploadedFile = await attachmentUploadService.uploadAttachment(conversationId, uploadArg);

    mimeType = uploadedFile.mimeType;
    fileName = uploadedFile.originalName;
    fileSize = uploadedFile.size;
    fileUrl = uploadedFile.url;
    fileProvider = uploadedFile.provider;
    filePublicId = uploadedFile.storageKey;
    messageType = uploadedFile.attachmentKind;
  }

  const message = await messageService.sendMessage(
    req.user!.userId, 
    conversationId, 
    content, 
    messageType, 
    fileUrl,
    fileProvider,
    filePublicId,
    fileName,
    fileSize,
    mimeType
  );

  // KHÔNG CẦN GỌI SOCKET Ở ĐÂY NỮA.
  // messageService đã emit sự kiện (Observer), và RealtimeMediator sẽ lắng nghe và tự động broadcast.
  
  res.status(201).json({ success: true, data: message });
});

export const getHistory = asyncHandle(async (req: AuthRequest, res: Response) => {
  // Pipeline đã xác thực permission và data
  const conversationId = (req as any).conversationId;
  
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));

  const result = await messageService.getHistory(conversationId, page, limit);

  res.status(200).json({
    success: true,
    message: "Fetched message history successfully",
    data: result
  });
});

export const searchMessages = asyncHandle(async (req: AuthRequest, res: Response) => {
  // Pipeline đã xác thực permission và data
  const conversationId = (req as any).conversationId;
  const keyword = req.query.keyword as string;
  const messageType = req.query.MessageType as string;

  const messages = await messageService.searchMessages(conversationId, keyword, messageType);

  res.status(200).json({ success: true, data: messages });
});