import { MessageModel } from "./message.model";

/**
 * Get message history with pagination
 * @param conversationId Conversation ID
 * @param page Current page
 * @param limit Messages per page
 */
export const getHistoryByConversation = async (
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
    .populate("sender", "fullName avatar")
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
};