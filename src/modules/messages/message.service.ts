import Message from './message.model';
import Conversation from '../conversations/conversation.model';

export const messageService = {
  sendMessage: async (
    senderId: string, 
    conversationId: string, 
    content: string, 
    messageType: 'text' | 'image' | 'video' | 'file',
    fileUrl?: string,
    fileName?: string
  ) => {
    const newMessage = await Message.create({
      sender: senderId,
      content,
      conversationId,
      messageType,
      fileUrl,
      fileName
    });

    const populatedMessage = await newMessage.populate('sender', 'fullName avatar email');

    // Cập nhật tin nhắn mới nhất cho đoạn chat
    await Conversation.findByIdAndUpdate(conversationId, { latestMessage: populatedMessage._id });

    return populatedMessage;
  },

  getMessages: async (conversationId: string) => {
    return await Message.find({ conversationId })
      .populate('sender', 'fullName avatar email')
      .sort({ createdAt: 1 });
  }
};