import { Response, NextFunction } from "express";
import { AuthRequest } from "../../types/custom";
import { RequestHandler } from "./BaseHandler";
import AppError from "../../utils/appError";
import mongoose from "mongoose";
import { ConversationModel } from "../../modules/conversations/conversation.model";

export class ConversationPermissionHandler extends RequestHandler {
  public async handle(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    // 1. Validate ID
    const conversationId = req.body?.ConversationId || req.body?.conversationId || req.params?.conversationId || req.query?.ConversationId || req.query?.conversationId;

    if (!conversationId) {
      return next(new AppError('Conversation ID is required', 400));
    }

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return next(new AppError('Invalid Conversation ID', 400));
    }

    if (!req.user?.userId) {
      return next(new AppError('Unauthorized', 401)); 
    }

    // 2. Check existence
    const conversation = await ConversationModel.findById(conversationId);
    if (!conversation) {
      return next(new AppError('Conversation does not exist', 404));
    }

    // 3. Check permission
    const isMember = (conversation.users || []).some(
      (userId: any) => userId?.toString() === req.user!.userId
    );

    if (!isMember) {
      return next(new AppError('You do not have permission to access this conversation', 403));
    }
    
    // Gán dữ liệu vào request để Controller sử dụng (tránh query lại)
    (req as any).conversationId = conversationId;
    (req as any).conversation = conversation; 
    
    // Pass pipeline
    await super.handle(req, res, next);
  }
}
