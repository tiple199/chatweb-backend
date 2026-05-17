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

/**
 * Accept friend request
 */
export const acceptFriendRequestService = async (requestId: string) => {
  const request = await FriendModel.findById(requestId);

  if (!request) throw new Error("Request not found");

  request.status = "accepted";
  await request.save();

  const conversation = await ConversationModel.create({
    type: "private",
    members: [request.requester, request.recipient]
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
  return FriendModel.find({
    $or: [{ requester: userId }, { recipient: userId }],
    status: "accepted"
  }).populate("requester recipient");
};