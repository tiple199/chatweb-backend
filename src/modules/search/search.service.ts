import { UserModel } from "@/modules/users/user.model";
import { MessageModel } from "@/modules/messages/message.model";
import { ConversationModel } from "@/modules/conversations/conversation.model";

export const searchService = async (
  keyword: string,
  userId: string,
  conversationId?: string,
  type?: string,
  senderId?: string
) => {
  if (!keyword.trim()) {
    return {
      users: [],
      messages: []
    };
  }

  /**
   * SEARCH USERS
   */
  const users = await UserModel.find({
    _id: { $ne: userId },
    $or: [
      {
        fullName: {
          $regex: keyword,
          $options: "i"
        }
      },
      {
        email: {
          $regex: keyword,
          $options: "i"
        }
      }
    ]
  })
    .select("fullName email avatar")
    .limit(10);

  /**
   * GET USER CONVERSATIONS
   */
  const conversations = await ConversationModel.find({
    members: userId
  }).select("_id");

  const conversationIds = conversations.map(
    conversation => conversation._id
  );

  /**
   * BUILD MESSAGE QUERY
   */
  const query: any = {
    content: {
      $regex: keyword,
      $options: "i"
    },
    conversationId: {
      $in: conversationIds
    }
  };

  /**
   * FILTER BY CONVERSATION
   */
  if (conversationId) {
    query.conversationId = conversationId;
  }

  /**
   * FILTER BY MESSAGE TYPE
   */
  if (type) {
    query.type = type;
  }

  /**
   * FILTER BY SENDER
   */
  if (senderId) {
    query.senderId = senderId;
  }

  /**
   * SEARCH MESSAGES
   */
  const messages = await MessageModel.find(query)
    .populate("senderId", "fullName avatar")
    .sort({ createdAt: -1 })
    .limit(10);

  return {
    users,
    messages
  };
};