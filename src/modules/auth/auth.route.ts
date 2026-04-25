import { AsyncHandler } from "@/types/asyncHandler";
import asyncHandler from "@/utils/asyncHandle";
import express, { Express } from "express"
import { forgotPasswordController, loginController, logoutController, refreshTokenController, registerController, resetPasswordController, sendOtpController } from "./auth.controller";
import { checkValidJWT } from "@/middlewares/jwt.middleware";

const router = express.Router();
const wrap = (fn: AsyncHandler) => asyncHandler(fn);
const authRoute = (app: Express) => {
    router.post("/register",wrap(registerController));
    router.post("/send-otp",wrap(sendOtpController));
    router.post("/login",wrap(loginController));
    router.post("/forgot-password",wrap(forgotPasswordController));
    router.post("/reset-password/:token",wrap(resetPasswordController));
    router.post("/refresh-token",wrap(refreshTokenController));
    router.post("/logout",checkValidJWT,wrap(logoutController));
    


    app.use("/api/auth",router);
}

export default authRoute;
