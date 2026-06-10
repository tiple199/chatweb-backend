import Conversation from './conversation.model';
import AppError from '../../utils/appError';
import { Types } from 'mongoose';
import { messageService } from '../messages/message.service';

/**
 * Get all conversations for a user
 * Returns user conversations with populated members and latest message
 */
export const getUserConversationsService = async (userId: string) => {
  const conversations = await Conversation.find({ users: userId })
    .populate('users', '-password')
    .populate('latestMessage')
    .sort({ updatedAt: -1 });

  return conversations
    .filter((conversation: any) => conversation && conversation._id)
    .map((conversation: any) => {
      const users = Array.isArray(conversation.users) ? conversation.users : [];
      const validUsers = users.filter((u: any) => u && u._id);
      const otherUser = validUsers.find((user: any) => user._id.toString() !== userId);

      return {
        conversationId: conversation._id.toString(),
        chatName:
          !conversation.isGroupChat && otherUser
            ? otherUser.fullName || 'Người dùng'
            : conversation.chatName || 'Không xác định',
        otherUserId: !conversation.isGroupChat && otherUser ? otherUser._id.toString() : null,
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
    const chat = await Conversation.findById(chatId);
    if (!chat) throw new AppError('Conversation not found', 404);

    const newNote = { content, createdBy: new Types.ObjectId(creatorId), createdAt: new Date() };
    const updated = await Conversation.findByIdAndUpdate(
      chatId,
      { $push: { notes: newNote } },
      { new: true }
    );

    if (!updated) throw new AppError('Failed to add note', 500);

    // Send system message
    await messageService.sendMessage(creatorId, chatId, `Đã thêm một ghi chú mới`, 'system');

    return updated;
  },

  // Get notes for a conversation
  getNotes: async (chatId: string) => {
    const chat = await Conversation.findById(chatId);
    if (!chat) throw new AppError('Conversation not found', 404);

    // Map to the format frontend expects
    return (chat.notes || []).map((note: any) => ({
      NoteId: note._id.toString(),
      ConversationId: chatId,
      Content: note.content,
      CreatedByUserId: note.createdBy.toString(),
      CreatedAt: note.createdAt.toISOString(),
      UpdatedAt: note.createdAt.toISOString()
    }));
  },

  // Update note
  updateNote: async (noteId: string, content: string) => {
    const updated = await Conversation.findOneAndUpdate(
      { 'notes._id': noteId },
      { $set: { 'notes.$.content': content } },
      { new: true }
    );
    if (!updated) throw new AppError('Note not found', 404);
    return updated;
  },

  // Delete note
  deleteNote: async (noteId: string) => {
    const updated = await Conversation.findOneAndUpdate(
      { 'notes._id': noteId },
      { $pull: { notes: { _id: noteId } } },
      { new: true }
    );
    if (!updated) throw new AppError('Note not found', 404);
    return updated;
  },

  // 5. Create a poll in a conversation
  createPoll: async (chatId: string, question: string, optionTexts: string[], creatorId: string) => {
    if (!question || optionTexts.length < 2) {
      throw new AppError('Poll must have a question and at least 2 options', 400);
    }

    const options = optionTexts.map(text => ({ text, voters: [] }));
    const pollId = new Types.ObjectId();
    const newPoll = { _id: pollId, question, options, createdBy: new Types.ObjectId(creatorId), isActive: true };

    const updated = await Conversation.findByIdAndUpdate(
      chatId,
      { $push: { polls: newPoll } },
      { new: true }
    );

    if (!updated) throw new AppError('Failed to create poll', 500);

    // Send poll message
    await messageService.sendMessage(creatorId, chatId, pollId.toString(), 'poll');

    return updated;
  },

  // Get polls for a conversation
  getPolls: async (chatId: string) => {
    const chat = await Conversation.findById(chatId);
    if (!chat) throw new AppError('Conversation not found', 404);

    return (chat.polls || []).map((poll: any) => ({
      PollId: poll._id.toString(),
      ConversationId: chatId,
      Question: poll.question,
      CreatedByUserId: poll.createdBy.toString(),
      CreatedAt: new Date().toISOString(), // Poll doesn't have createdAt in schema currently, fallback to now or we can add it later
      IsActive: poll.isActive,
      Options: (poll.options || []).map((opt: any) => ({
        OptionId: opt._id.toString(),
        PollId: poll._id.toString(),
        OptionText: opt.text,
        VoterIds: (opt.voters || []).map((v: any) => v.toString())
      }))
    }));
  },

  // 6. Vote on a poll option
  votePoll: async (chatId: string, pollId: string, optionId: string, userId: string) => {
    const chat = await Conversation.findById(chatId);
    if (!chat) throw new AppError('Conversation not found', 404);

    const poll = (chat.polls || []).find(p => p._id?.toString() === pollId);
    if (!poll) throw new AppError('Poll not found', 404);

    // Remove existing vote from this user on this poll
    (poll.options || []).forEach(opt => {
      opt.voters = (opt.voters || []).filter(v => v.toString() !== userId) as Types.ObjectId[];
    });

    // Add new vote
    const targetOption = (poll.options || []).find(opt => opt._id?.toString() === optionId);
    if (targetOption) {
      targetOption.voters.push(new Types.ObjectId(userId));
    }

    await chat.save();
    return chat;
  },

  // Update conversation
  updateConversation: async (chatId: string, data: any, requesterId: string) => {
    const chat = await Conversation.findById(chatId);
    if (!chat) throw new AppError('Conversation not found', 404);
    
    // Check if requester is in chat
    if (!chat.users.some(u => u.toString() === requesterId)) {
      throw new AppError('You are not in this conversation', 403);
    }
    
    const updated = await Conversation.findByIdAndUpdate(
      chatId,
      { $set: data },
      { new: true }
    ).populate('users', '-password');
    return updated;
  },

  // Add member to group
  addMember: async (chatId: string, userIdToAdd: string, requesterId: string) => {
    const chat = await Conversation.findById(chatId);
    if (!chat || !chat.isGroupChat) throw new AppError('Group chat not found', 404);
    
    if (!chat.users.some(u => u.toString() === requesterId)) {
      throw new AppError('You are not in this group', 403);
    }
    if (chat.users.some(u => u.toString() === userIdToAdd)) {
      throw new AppError('User is already in group', 400);
    }
    
    const updated = await Conversation.findByIdAndUpdate(
      chatId,
      { $push: { users: userIdToAdd } },
      { new: true }
    ).populate('users', '-password');
    return updated;
  },

  // Get participants
  getParticipants: async (chatId: string) => {
    const chat = await Conversation.findById(chatId).populate('users', '-password');
    if (!chat) throw new AppError('Conversation not found', 404);
    
    const validUsers = (chat.users || []).filter((u: any) => u && u._id);
    
    return validUsers.map((user: any) => ({
      userId: user._id.toString(),
      fullName: user.fullName,
      email: user.email,
      role: (chat.groupAdmins || []).some((adminId: any) => adminId?.toString() === user._id.toString()) ? 'admin' : 'member'
    }));
  }
};