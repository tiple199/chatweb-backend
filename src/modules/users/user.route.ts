import express, { Express } from "express";
import { AsyncHandler } from "@/types/asyncHandler";
import asyncHandler from "@/utils/asyncHandle";
import { getUser, updateAvatar, searchUsers} from "./user.controller"; // Import thêm updateAvatar
import { checkValidJWT } from "@/middlewares/jwt.middleware";
import { avatarUpload } from "@/config/multer"; // Upload ảnh đại diện bằng memory storage

const router = express.Router();
const wrap = (fn: AsyncHandler) => asyncHandler(fn);

const userRoute = (app: Express) => {
    // API lấy thông tin cá nhân
    router.get("/profile", checkValidJWT, getUser);

    // API cập nhật ảnh đại diện (giống Telegram)
    // avatarUpload.single("avatar") sẽ xử lý file gửi lên với key là 'avatar'
    router.post(
        "/update-avatar", 
        checkValidJWT, 
        avatarUpload.single("avatar"), 
        updateAvatar
    );

    router.get("/search", checkValidJWT, searchUsers);

    app.use("/api/user", router);

}

export default userRoute;