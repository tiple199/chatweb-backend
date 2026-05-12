import { Request, Response } from "express";
import { UserModel } from "../users/user.model";
import { ConversationModel } from "../conversations/conversation.model";

export const getAllUsers = async (req: Request, res: Response) => {
    const users = await UserModel.find().select("-password");
    return res.status(200).json({
        success: true,
        message: "List of all users",
        data: {
            users
        }
    });
}   


//conversations
export const getAllConversations = async (req: Request, res: Response) => {
    const conversations = await ConversationModel.find().populate("members", "fullName email avatar").populate("lastMessageId");
    return res.status(200).json({
        success: true,
        message: "List of all conversations",  
        data: {
            conversations
        }
    });
}

export const createPrivateConversation = async (req: Request, res: Response) => {
    const { userId1, userId2 } = req.body;

    // Kiểm tra nếu đã tồn tại cuộc trò chuyện giữa hai người dùng
    const existingConversation = await ConversationModel.findOne({
        type: "private",
        members: { $all: [userId1, userId2] }
    });

    if (existingConversation) {
        return res.status(200).json({
            success: true,
            message: "Private conversation already exists",
            data: {
                conversation: existingConversation
            }
        });
    }   

    // Nếu chưa tồn tại, tạo cuộc trò chuyện mới
    const newConversation = new ConversationModel({
        type: "private",
        members: [userId1, userId2]
    });

    await newConversation.save();
    return res.status(201).json({
        success: true,
        message: "Private conversation created successfully",
        data: {
            conversation: newConversation
        }
    });
}