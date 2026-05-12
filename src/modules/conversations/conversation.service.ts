import { ConversationModel } from "./conversation.model";

export const getUserConversationsService = async (userId: string) => {
  const conversations = await ConversationModel.find({ members: userId })
    .populate("members", "fullName avatar email")
    .populate("lastMessageId")
    .sort({ updatedAt: -1 });

  return conversations.map((conversation: any) => {
    const members = Array.isArray(conversation.members) ? conversation.members : [];
    const otherMember = members.find((member: any) => member?._id?.toString() !== userId);

    return {
      ConversationId: conversation._id.toString(),
      ChatName:
        conversation.type === "group"
          ? conversation.name || "Nhóm trò chuyện"
          : otherMember?.fullName || conversation.name || "Cuộc trò chuyện",
      IsGroupChat: conversation.type === "group",
      GroupAdminId: undefined,
      LatestMessageId: conversation.lastMessageId?._id?.toString?.() || conversation.lastMessageId?.toString?.() || null,
      CreateAt: conversation.createdAt,
      UpdatedAt: conversation.updatedAt,
      IsActive: true,
    };
  });
};