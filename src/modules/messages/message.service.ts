import { MessageModel } from "./message.model";
import { ConversationModel } from "../conversations/conversation.model";

export const messageService = {
  sendMessage: async (
    senderId: string, 
    conversationId: string, 
    content: string, 
    messageType: 'text' | 'image' | 'video' | 'file',
    fileUrl?: string,
    fileName?: string,
    fileSize?: number,
    mimeType?: string
  ) => {
    const newMessage = await MessageModel.create({
      sender: senderId,
      content,
      conversationId,
      messageType,
      fileUrl,
      fileName,
      fileSize,
      mimeType
    });

    const populatedMessage = await newMessage.populate('sender', 'fullName avatar email');

    // Cập nhật tin nhắn mới nhất cho đoạn chat
    await ConversationModel.findByIdAndUpdate(conversationId, { latestMessage: populatedMessage._id });

    return populatedMessage;
  },

  getHistory: async (
    conversationId: string, 
    page: number, 
    limit: number
  ) => {
    const skip = (page - 1) * limit;

    // Get messages sorted by newest first for pagination
    const messages = await MessageModel.find({ conversationId })
      .sort({ createdAt: -1 }) 
      .skip(skip)
      .limit(limit)
      .populate("sender", "fullName avatar email")
      .lean(); // Use lean for plain JS objects, faster response

    // Count total messages to calculate total pages
    const totalMessages = await MessageModel.countDocuments({ conversationId });

    return {
      // Reverse to show oldest at top, newest at bottom (correct chat UI)
      messages: messages.reverse(), 
      currentPage: page,
      totalPages: Math.ceil(totalMessages / limit),
      totalMessages
    };
  },

  searchMessages: async (conversationId: string, keyword: string, messageType?: string) => {
    const filter: any = { conversationId };
    
    if (keyword) {
      filter.content = { $regex: keyword, $options: 'i' };
    }
    if (messageType) {
      filter.messageType = messageType;
    }

    const messages = await MessageModel.find(filter)
      .sort({ createdAt: -1 })
      .populate("sender", "fullName avatar email")
      .lean();

    return messages;
  }
};