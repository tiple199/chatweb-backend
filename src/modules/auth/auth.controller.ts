import { Request, Response } from "express"
import AppError from "@/utils/appError";
import { emailSchema, loginSchema, refreshTokenSchema, registerSchema, resetPasswordSchema } from "@/validation/auth.schema";
import { forgotPasswordService, loginService, logoutService, refreshTokenService, registerService, resetPasswordService, sendOtpService } from "./auth.service";
import { sendOTPEmail, sendResetPasswordEmail } from "@/utils/mailer";
import { delay } from "@/utils/share";


const registerController = async (req:Request,res:Response) => {
    const validation = await registerSchema.safeParse(req.body);
    if(!validation.success){
        const errorZod = validation.error.issues;
        const seenFields = new Set<string>();
        const firstErrors = errorZod
        .filter((err) => {
            const field = err.path[0] as string;
            if(seenFields.has(field)) return false;
            seenFields.add(field);
            return true;
        })
        .map((err) => ({
                field: String(err.path[0]),
                message: err.message
            }));

        throw new AppError("Validation failed.", 400, firstErrors);
    }

    const {email, password,fullName, otp} = validation.data;

    await registerService(email, password, fullName, otp);
    
    return res.status(200).json({
        success: true,
        message: "User registered successfully",
    })
    
}

const loginController = async (req:Request,res:Response) => {
    const validation = await loginSchema.safeParse(req.body);
    if(!validation.success){
        const errorZod = validation.error.issues;
        const seenFields = new Set<string>();
        const firstErrors = errorZod
        .filter((err) => {
            const field = err.path[0] as string;
            if(seenFields.has(field)) return false;
            seenFields.add(field);
            return true;
        })
        .map((err) => ({
                field: String(err.path[0]),
                message: err.message
            }));

        throw new AppError("Validation failed.", 400, firstErrors);
    }

    const {email, password} = validation.data;

    const {accessToken,refreshToken} = await loginService(email, password);
    
    return res.status(200).json({
        success: true,
        message: "User logged in successfully",
        data: {
            accessToken,
            refreshToken,
        }
    })
    
}

const sendOtpController = async (req:Request,res:Response) => {
    const validation = await emailSchema.safeParse(req.body.email);
    if(!validation.success){
        const errorZod = validation.error.issues;
        const seenFields = new Set<string>();
        const firstErrors = errorZod
        .filter((err) => {
            const field = err.path[0] as string;
            if(seenFields.has(field)) return false;
            seenFields.add(field);
            return true;
        })
        .map((err) => ({
                field: String(err.path[0]),
                message: err.message
            }));

        throw new AppError("Validation failed.", 400, firstErrors);
    }

    const email = validation.data;

    const result = await sendOtpService(email);
    
    sendOTPEmail(email,result.token);

    await delay(2000);

    return res.status(200).json({
        success: true,
        message: "OTP sent successfully",
    })
    
}

const forgotPasswordController = async (req:Request,res:Response) => {
    const validation = await emailSchema.safeParse(req.body.email);
    if(!validation.success){
        const errorZod = validation.error.issues;
        const seenFields = new Set<string>();
        const firstErrors = errorZod
        .filter((err) => {
            const field = err.path[0] as string;
            if(seenFields.has(field)) return false;
            seenFields.add(field);
            return true;
        })
        .map((err) => ({
                field: String(err.path[0]),
                message: err.message
            }));

        throw new AppError("Validation failed.", 400, firstErrors);
    }

    const email = validation.data;

    const result = await forgotPasswordService(email);
    
    sendResetPasswordEmail(email,result.token);

    await delay(2000);

    return res.status(200).json({
        success: true,
        message: "Reset password email sent successfully"
    })
    
}

const resetPasswordController = async (req:Request,res:Response) => {
    const token = req.params.token as string;
    if (!token) {
        throw new AppError("Token is required", 400, [{field: "token", message: "Token is required"}]);
    }
    const validation = await resetPasswordSchema.safeParse(req.body);
    if(!validation.success){
        const errorZod = validation.error.issues;
        const seenFields = new Set<string>();
        const firstErrors = errorZod
        .filter((err) => {
            const field = err.path[0] as string;
            if(seenFields.has(field)) return false;
            seenFields.add(field);
            return true;
        })
        .map((err) => ({
                field: String(err.path[0]),
                message: err.message
            }));

        throw new AppError("Validation failed.", 400, firstErrors);
    }
    
    await resetPasswordService(token,validation.data.password);

    return res.status(200).json({
        success: true,
        message: "Password reset successfully",
    })
}

const refreshTokenController = async (req:Request,res:Response) => {
    const { refreshToken } = req.body;
    const validation = await refreshTokenSchema.safeParseAsync(refreshToken);
    if(!validation.success) {
        const errorZod = validation.error.issues;
        const firstErrors = errorZod            .map((err) => ({
                field: String(err.path[0] ?? "general"),
                message: err.message
            }));
        throw new AppError("Validation failed.", 400, firstErrors);
    }

    const result = await refreshTokenService(refreshToken);

    return res.status(200).json({
        success: true,
        message: "Token refreshed successfully.",
        data: {
            accessToken: result.accessToken
        }
    });
}

const logoutController = async (req:Request,res:Response) => {
    const {refreshToken} = req.body;
    const validation = await refreshTokenSchema.safeParseAsync(refreshToken);
    if(!validation.success) {
        const errorZod = validation.error.issues;
        const firstErrors = errorZod            .map((err) => ({
                field: String(err.path[0] ?? "general"),
                message: err.message
            }));
        throw new AppError("Validation failed.", 400, firstErrors);
    }
    const userId = req.user?.userId as string;
    
    await logoutService(userId,refreshToken);

    return res.status(200).json({
        success: true,
        message: "User logged out successfully",
    })
}

export { registerController,loginController,sendOtpController,forgotPasswordController,resetPasswordController,refreshTokenController,logoutController}