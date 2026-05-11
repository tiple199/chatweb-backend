import AppError from "@/utils/appError";
import { Request, Response } from "express";
import { UserModel } from "./user.model";
import asyncHandler from "@/utils/asyncHandle";
import fs from "fs";
import path from "path";

// API lấy profile người dùng
const getUser = (req: Request, res: Response) => {
    if (!req.user) {
        throw new AppError("User not authenticated.", 401);
    }
    return res.status(200).json({
        success: true,
        message: "User profile",
        data: { user: req.user }
    });
}

// API cập nhật ảnh đại diện
const updateAvatar = asyncHandler(async (req: Request, res: Response) => {
    // 1. Kiểm tra xác thực
    if (!req.user) {
        throw new AppError("User not authenticated.", 401);
    }

    // 2. Kiểm tra xem file đã được multer xử lý chưa
    if (!req.file) {
        throw new AppError("Vui lòng chọn ảnh để tải lên.", 400);
    }

    const userId = req.user.userId;

    // 3. Lấy user cũ để xóa file avatar cũ
    const oldUser = await UserModel.findById(userId);
    
    // 4. Lưu relative path (không full URL) - để flexible khi migrate server
    // Ví dụ: /uploads/avatars/avatar-xxx.jpg
    const avatarPath = `/uploads/avatars/${req.file.filename}`;
    
    // 5. Cập nhật vào Database
    const updatedUser = await UserModel.findByIdAndUpdate(
        userId,
        { avatar: avatarPath },
        { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
        throw new AppError("Không tìm thấy người dùng.", 404);
    }

    // 6. Xóa file avatar cũ (cleanup)
    if (oldUser?.avatar) {
        try {
            // Giả sử avatar cũ là relative path hoặc filename
            let oldFilePath = oldUser.avatar;
            // Nếu là full URL, extract filename
            if (oldFilePath.startsWith('http')) {
                oldFilePath = oldFilePath.split('/uploads/')[1];
                oldFilePath = `uploads/${oldFilePath}`;
            } else if (oldFilePath.startsWith('/uploads/')) {
                oldFilePath = oldFilePath.substring(1); // Remove leading /
            }
            
            if (fs.existsSync(oldFilePath)) {
                fs.unlinkSync(oldFilePath);
            }
        } catch (error) {
            // Log error nhưng không throw - file cleanup không nên block update
            console.error("Error deleting old avatar:", error);
        }
    }

    // 7. Trả về kết quả
    return res.status(200).json({
        success: true,
        message: "Cập nhật ảnh đại diện thành công",
        data: {
            user: updatedUser
        }
    });
});

export { getUser, updateAvatar };