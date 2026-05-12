import { Request, Response } from "express";
import {
  sendFriendRequestService,
  acceptFriendRequestService,
  declineFriendRequestService,
  getFriendsService
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

    req.io?.to(recipient).emit("friend_request", {
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

    req.io?.to(request.requester.toString()).emit("friend_accepted", {
      conversationId: conversation._id
    });

    return res.json({
      message: "Accepted",
      conversationId: conversation._id
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

    // optional socket event
    req.io?.to(request.requester.toString()).emit(
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