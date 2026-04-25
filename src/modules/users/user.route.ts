import express, { Express } from "express";
import { AsyncHandler } from "@/types/asyncHandler";
import asyncHandler from "@/utils/asyncHandle";
import { getUser } from "./user.controller";
import { checkValidJWT } from "@/middlewares/jwt.middleware";

const router = express.Router();
const wrap = (fn: AsyncHandler) => asyncHandler(fn);
const userRoute = (app: Express) => {
    router.get("/profile",checkValidJWT, getUser);

    app.use("/api/user",router);
}

export default userRoute;