import express from "express";
import { checkValidJWT } from "@/middlewares/jwt.middleware";
import {
  sendFriendRequest,
  acceptFriendRequest,
  getFriends,
  declineFriendRequest
} from "./friend.controller";

const router = express.Router();

router.post("/add", checkValidJWT, sendFriendRequest);
router.post("/accept", checkValidJWT, acceptFriendRequest);
router.post("/decline", checkValidJWT, declineFriendRequest);
router.get("/", checkValidJWT, getFriends);

export default router;