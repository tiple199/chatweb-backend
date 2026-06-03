import { Request, Response } from "express";
import { Server } from "socket.io";
import {
  sendFriendRequestService,
  acceptFriendRequestService,
  declineFriendRequestService,
  getFriendsService,
  getPendingFriendRequestsService,
  getFriendStatusService,
  cancelFriendRequestService,
  unfriendService
} from "./friend.service";

const getErrorMessage = (err: unknown): string => {
  if (err instanceof Error) return err.message;
  return "Unknown error";
};

/**
 * POST /api/friends/add
 */
export const sendFriendRequest = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const requester = req.user.userId;
    const { recipient } = req.body;

    if (!recipient) {
      return res.status(400).json({ message: "recipient is required" });
    }

    const request = await sendFriendRequestService(requester, recipient);
    const io = req.app.get("io") as Server | undefined;

    io?.to(recipient).emit("friend_request", {
      from: requester,
      requestId: request._id
    });

    return res.json({ message: "Request sent" });
  } catch (err) {
    return res.status(400).json({ message: getErrorMessage(err) });
  }
};

/**
 * POST /api/friends/accept
 */
export const acceptFriendRequest = async (req: Request, res: Response) => {
  try {
    const { requestId } = req.body;

    if (!requestId) {
      return res.status(400).json({ message: "requestId is required" });
    }

    const { request, conversation } =
      await acceptFriendRequestService(requestId);

    const io = req.app.get("io") as Server | undefined;
    io?.to(request.requester.toString()).emit("friend_accepted", {
      conversationId: (conversation as any)._id
    });

    return res.json({
      message: "Accepted",
      conversationId: (conversation as any)._id
    });
  } catch (err) {
    return res.status(400).json({ message: getErrorMessage(err) });
  }
};

/**
 * POST /api/friends/decline
 */
export const declineFriendRequest = async (
  req: Request,
  res: Response
) => {
  try {
    const { requestId } = req.body;

    if (!requestId) {
      return res.status(400).json({
        message: "requestId is required"
      });
    }

    const request = await declineFriendRequestService(requestId);
    const io = req.app.get("io") as Server | undefined;

    io?.to(request.requester.toString()).emit(
      "friend_declined",
      {
        requestId: request._id
      }
    );

    return res.json({
      message: "Friend request declined"
    });
  } catch (err) {
    return res.status(400).json({
      message: getErrorMessage(err)
    });
  }
};

/**
 * GET /api/friends
 */
export const getFriends = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.userId;

    const friends = await getFriendsService(userId);

    return res.json(friends);
  } catch (err) {
    return res.status(400).json({
      message: getErrorMessage(err)
    });
  }
};

export const getFriendRequests = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const requests = await getPendingFriendRequestsService(req.user.userId);
    return res.json({ success: true, data: requests });
  } catch (err) {
    return res.status(400).json({ message: getErrorMessage(err) });
  }
};

export const getFriendStatus = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { targetUserId } = req.params;
    if (!targetUserId) {
      return res.status(400).json({ message: "targetUserId is required" });
    }

    const status = await getFriendStatusService(req.user.userId, targetUserId);
    return res.json({ success: true, data: { status } });
  } catch (err) {
    return res.status(400).json({ message: getErrorMessage(err) });
  }
};

export const cancelFriendRequest = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { recipient } = req.body;
    if (!recipient) {
      return res.status(400).json({ message: "recipient is required" });
    }

    await cancelFriendRequestService(req.user.userId, recipient);
    return res.json({ success: true, message: "Request cancelled" });
  } catch (err) {
    return res.status(400).json({ message: getErrorMessage(err) });
  }
};

export const unfriend = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const friendId = req.params.friendId;
    if (!friendId) {
      return res.status(400).json({ message: "friendId is required" });
    }

    await unfriendService(req.user.userId, friendId);
    return res.json({ success: true, message: "Friend removed" });
  } catch (err) {
    return res.status(400).json({ message: getErrorMessage(err) });
  }
};