import express from "express";
import { checkValidJWT } from "@/middlewares/jwt.middleware";
import {
  sendFriendRequest,
  acceptFriendRequest,
  getFriends,
  declineFriendRequest,
  getFriendRequests,
  getFriendStatus,
  cancelFriendRequest,
  unfriend
} from "./friend.controller";

const router = express.Router();

router.post("/add", checkValidJWT, sendFriendRequest);
router.post("/accept", checkValidJWT, acceptFriendRequest);
router.post("/decline", checkValidJWT, declineFriendRequest);
router.get("/requests", checkValidJWT, getFriendRequests);
router.get("/status/:targetUserId", checkValidJWT, getFriendStatus);
router.post("/cancel", checkValidJWT, cancelFriendRequest);
router.delete("/:friendId", checkValidJWT, unfriend);
router.get("/", checkValidJWT, getFriends);

export default router;