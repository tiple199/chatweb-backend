import express, { Express } from "express";
import { getAllUsers, getAllConversations, createPrivateConversation} from "./debug.controller";
import { get } from "mongoose";
    

const router = express.Router();

const debugUserRoute = (app: Express) => {
    router.get("/users", getAllUsers);

    router.get("/conversations", getAllConversations);
    router.post("/conversations/new", createPrivateConversation);

    app.use("/api/debug", router);
}

export default debugUserRoute;