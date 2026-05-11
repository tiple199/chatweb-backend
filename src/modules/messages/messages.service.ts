import { MessageModel } from "./message.model";

/**
 * Lấy lịch sử tin nhắn có phân trang
 * @param conversationId ID cuộc hội thoại
 * @param page Trang hiện tại
 * @param limit Số lượng tin mỗi trang
 */
export const getHistoryByConversation = async (
  conversationId: string, 
  page: number, 
  limit: number
) => {
  const skip = (page - 1) * limit;

  // Lấy danh sách tin nhắn, sắp xếp mới nhất trước để phân trang chính xác
  const messages = await MessageModel.find({ conversationId })
    .sort({ createdAt: -1 }) 
    .skip(skip)
    .limit(limit)
    .populate("senderId", "fullName avatar")
    .lean(); // Dùng lean để trả về object JS thuần, tăng tốc độ

  // Đếm tổng số tin nhắn để tính tổng số trang
  const totalMessages = await MessageModel.countDocuments({ conversationId });

  return {
    // Đảo ngược mảng để tin nhắn cũ ở trên, tin mới ở dưới (đúng UI Chat)
    messages: messages.reverse(), 
    currentPage: page,
    totalPages: Math.ceil(totalMessages / limit),
    totalMessages
  };
};