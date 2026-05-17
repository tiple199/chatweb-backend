import Conversation from './conversation.model';
import AppError from '../../utils/appError';
import { Types } from 'mongoose';

/**
 * Get all conversations for a user
 * Returns user conversations with populated members and latest message
 */
export const getUserConversationsService = async (userId: string) => {
  const conversations = await Conversation.find({ users: userId })
    .populate('users', '-password')
    .populate('latestMessage')
    .sort({ updatedAt: -1 });

  return conversations.map((conversation: any) => {
    const users = Array.isArray(conversation.users) ? conversation.users : [];
    const otherUser = users.find((user: any) => user?._id?.toString() !== userId);

    return {
      conversationId: conversation._id.toString(),
      chatName:
        !conversation.isGroupChat && otherUser
          ? otherUser.fullName || 'User'
          : conversation.chatName || 'Conversation',
      isGroupChat: conversation.isGroupChat,
      groupAdmins: conversation.groupAdmins || [],
      latestMessage: conversation.latestMessage,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    };
  });
};

/**
 * Service object containing all conversation operations
 */
export const conversationService = {
  // 1. Create or access a direct 1-to-1 chat
  accessDirectChat: async (userId: string, targetUserId: string) => {
    if (userId === targetUserId) {
      throw new AppError('Cannot create chat with yourself', 400);
    }

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

  // 2. Create a group chat
  createGroupChat: async (chatName: string, users: string[], creatorId: string) => {
    if (users.length < 2) {
      throw new AppError('Group must have at least 2 members', 400);
    }
    
    // Add creator to the users list if not already present
    if (!users.includes(creatorId)) {
      users.push(creatorId);
    }

    const groupChat = await Conversation.create({
      chatName,
      users,
      isGroupChat: true,
      groupAdmins: [creatorId]
    });

    return await Conversation.findById(groupChat._id).populate('users', '-password');
  },

  // 3. Remove a user from a group chat
  removeFromGroup: async (chatId: string, userIdToRemove: string, requesterId: string) => {
    const chat = await Conversation.findById(chatId);
    if (!chat || !chat.isGroupChat) {
      throw new AppError('Group chat not found', 404);
    }

    const isAdmin = chat.groupAdmins.some(adminId => adminId.toString() === requesterId);
    if (!isAdmin && requesterId !== userIdToRemove) {
      throw new AppError('Only group admins can remove members', 403);
    }

    const updated = await Conversation.findByIdAndUpdate(
      chatId,
      { 
        $pull: { users: userIdToRemove, groupAdmins: userIdToRemove } 
      },
      { new: true }
    ).populate('users', '-password');

    if (!updated) throw new AppError('Failed to update group', 500);
    return updated;
  },

  // 4. Add a note to a conversation
  addNote: async (chatId: string, content: string, creatorId: string) => {
    const updated = await Conversation.findByIdAndUpdate(
      chatId,
      { $push: { notes: { content, createdBy: creatorId } } },
      { new: true }
    );

    if (!updated) throw new AppError('Failed to add note', 500);
    return updated;
  },

  // 5. Create a poll in a conversation
  createPoll: async (chatId: string, question: string, optionTexts: string[], creatorId: string) => {
    if (!question || optionTexts.length < 2) {
      throw new AppError('Poll must have a question and at least 2 options', 400);
    }

    const options = optionTexts.map(text => ({ text, voters: [] }));
    const updated = await Conversation.findByIdAndUpdate(
      chatId,
      { $push: { polls: { question, options, createdBy: creatorId } } },
      { new: true }
    );

    if (!updated) throw new AppError('Failed to create poll', 500);
    return updated;
  },

  // 6. Vote on a poll option
  votePoll: async (chatId: string, pollId: string, optionId: string, userId: string) => {
    const chat = await Conversation.findById(chatId);
    if (!chat) throw new AppError('Conversation not found', 404);

    const poll = chat.polls.find(p => p._id?.toString() === pollId);
    if (!poll) throw new AppError('Poll not found', 404);

    // Remove existing vote from this user on this poll
    poll.options.forEach(opt => {
      opt.voters = opt.voters.filter(v => v.toString() !== userId) as Types.ObjectId[];
    });

    // Add new vote
    const targetOption = poll.options.find(opt => opt._id?.toString() === optionId);
    if (targetOption) {
      targetOption.voters.push(new Types.ObjectId(userId));
    }

    await chat.save();
    return chat;
  }
};