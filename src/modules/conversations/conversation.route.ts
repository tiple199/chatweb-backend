import { Express } from "express";
import { checkValidJWT } from "@/middlewares/jwt.middleware";
import { getUserConversations } from "./conversation.controller";

const conversationRoute = (app: Express) => {
  app.get("/api/conversations", checkValidJWT, getUserConversations);
};

export default conversationRoute;