import AppError from "@/utils/appError";
import { Request, Response } from "express";
const getUser = (req: Request, res: Response) => {
    if(!req.user) {
        throw new AppError("User not authenticated.", 401);
    }
    return res.status(200).json({
        success: true, 
        message: "User profile",
        data: {user: req.user} 
    });
    
}

export { getUser }