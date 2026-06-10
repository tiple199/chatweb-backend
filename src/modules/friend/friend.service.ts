import { FriendModel } from "./friend.model";
import { ConversationModel } from "../conversations/conversation.model";

/**
 * Send friend request
 */
export const sendFriendRequestService = async (
  requester: string,
  recipient: string
) => {
  if (requester === recipient) {
    throw new Error("Cannot add yourself");
  }

  const existing = await FriendModel.findOne({
    $or: [
      { requester, recipient },
      { requester: recipient, recipient: requester }
    ]
  });

  if (existing) {
    throw new Error("Friend request already exists");
  }

  return FriendModel.create({ requester, recipient });
};

export const getPendingFriendRequestsService = async (userId: string) => {
  return FriendModel.find({ recipient: userId, status: "pending" }).populate(
    "requester",
    "-password"
  );
};

export const getFriendStatusService = async (
  userId: string,
  targetUserId: string
) => {
  if (userId === targetUserId) {
    return "friends";
  }

  const relation = await FriendModel.findOne({
    $or: [
      { requester: userId, recipient: targetUserId },
      { requester: targetUserId, recipient: userId }
    ]
  });

  if (!relation) return "none";
  if (relation.status === "accepted") return "friends";
  if (relation.status === "pending") {
    return relation.requester.toString() === userId ? "pending_sent" : "pending_received";
  }

  return "none";
};

export const cancelFriendRequestService = async (
  requester: string,
  recipient: string
) => {
  const request = await FriendModel.findOneAndDelete({
    requester,
    recipient,
    status: "pending"
  });

  if (!request) {
    throw new Error("Friend request not found or already processed");
  }

  return request;
};

export const unfriendService = async (
  userId: string,
  friendId: string
) => {
  const friendship = await FriendModel.findOneAndDelete({
    $or: [
      { requester: userId, recipient: friendId, status: "accepted" },
      { requester: friendId, recipient: userId, status: "accepted" }
    ]
  });

  if (!friendship) {
    throw new Error("Friendship not found");
  }

  return friendship;
};

/**
 * Accept friend request
 */
export const acceptFriendRequestService = async (requestId: string) => {
  const request = await FriendModel.findById(requestId);

  if (!request) throw new Error("Request not found");

  request.status = "accepted";
  await request.save();

  const conversation = await ConversationModel.create({
    chatName: "Sender",
    isGroupChat: false,
    users: [request.requester, request.recipient]
  });

  return { request, conversation };
};


/**
 * Decline friend request
 */
export const declineFriendRequestService = async (
  requestId: string
) => {
  const request = await FriendModel.findById(requestId);

  if (!request) {
    throw new Error("Request not found");
  }

  await FriendModel.findByIdAndDelete(requestId);

  return request;
};


/**
 * Get friend list
 */
export const getFriendsService = async (userId: string) => {
  const friendships = await FriendModel.find({
    $or: [{ requester: userId }, { recipient: userId }],
    status: "accepted"
  }).populate("requester recipient");

  return friendships
    .filter(f => f.requester && f.recipient)
    .map(f => {
      // Return the user that is not the current user
      const requester = f.requester as any;
      const recipient = f.recipient as any;
      return requester._id.toString() === userId.toString() ? recipient : requester;
    });
};