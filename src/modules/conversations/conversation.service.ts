import Conversation from './conversation.model';
import AppError from '../../utils/appError';
import { Types } from 'mongoose';

export const conversationService = {
  // 1. Tạo hoặc Lấy chat 1-1
  accessDirectChat: async (userId: string, targetUserId: string) => {
    let chat = await Conversation.findOne({
      isGroupChat: false,
      $and: [
        { users: { $elemMatch: { $eq: userId } } },
        { users: { $elemMatch: { $eq: targetUserId } } }
      ]
    }).populate('users', '-password').populate('latestMessage');

    if (chat) return chat;

    const newChat = await Conversation.create({
      chatName: 'Sender',
      isGroupChat: false,
      users: [userId, targetUserId]
    });

    return await Conversation.findById(newChat._id).populate('users', '-password');
  },

  // 2. Chat Nhóm: Tạo, Thêm, Xóa, Cấp quyền
  createGroupChat: async (chatName: string, users: string[], creatorId: string) => {
    if (users.length < 2) throw new AppError('Nhóm phải có từ 2 thành viên trở lên', 400);
    users.push(creatorId);

    const groupChat = await Conversation.create({
      chatName,
      users,
      isGroupChat: true,
      groupAdmins: [creatorId]
    });

    return await Conversation.findById(groupChat._id).populate('users', '-password');
  },

  removeFromGroup: async (chatId: string, userIdToRemove: string, requesterId: string) => {
    const chat = await Conversation.findById(chatId);
    if (!chat || !chat.isGroupChat) throw new AppError('Không tìm thấy nhóm', 404);

    const isAdmin = chat.groupAdmins.includes(new Types.ObjectId(requesterId));
    if (!isAdmin && requesterId !== userIdToRemove) {
      throw new AppError('Chỉ Quản trị viên mới được xóa thành viên', 403);
    }

    return await Conversation.findByIdAndUpdate(
      chatId,
      { $pull: { users: userIdToRemove, groupAdmins: userIdToRemove } },
      { new: true }
    ).populate('users', '-password');
  },

  // 3. Tính năng Nhóm: Ghi chú
  addNote: async (chatId: string, content: string, creatorId: string) => {
    return await Conversation.findByIdAndUpdate(
      chatId,
      { $push: { notes: { content, createdBy: creatorId } } },
      { new: true }
    );
  },

  // 4. Tính năng Nhóm: Bình chọn
  createPoll: async (chatId: string, question: string, optionTexts: string[], creatorId: string) => {
    const options = optionTexts.map(text => ({ text, voters: [] }));
    return await Conversation.findByIdAndUpdate(
      chatId,
      { $push: { polls: { question, options, createdBy: creatorId } } },
      { new: true }
    );
  },

  votePoll: async (chatId: string, pollId: string, optionId: string, userId: string) => {
    const chat = await Conversation.findById(chatId);
    if (!chat) throw new AppError('Không tìm thấy nhóm', 404);

    const poll = chat.polls.find(p => p._id?.toString() === pollId);
    if (!poll) throw new AppError('Không tìm thấy bình chọn', 404);

    // Xóa vote cũ của user trong poll này (nếu có)
    poll.options.forEach(opt => {
      opt.voters = opt.voters.filter(v => v.toString() !== userId) as Types.ObjectId[];
    });

    // Thêm vote mới
    const targetOption = poll.options.find(opt => opt._id?.toString() === optionId);
    if (targetOption) {
      targetOption.voters.push(new Types.ObjectId(userId));
    }

    await chat.save();
    return chat;
  }
};