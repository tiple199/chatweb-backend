import AppError from "@/utils/appError";
import { UserModel } from "users/user.model";
import { AuthTokenModel } from "authToken/authToken.model";
import { comparePassword, generateRefreshToken, generateToken, hashPassword } from "@/utils/share";
import { RefreshTokenModel, RefreshTokenWithUser } from "../refreshToken/refreshToken.model";
import crypto from "crypto";
import "dotenv/config";

const isEmailExists = async (email: string) => {
    const emailExists = await UserModel.findOne({email});
    return !!emailExists;
}
// function rate limit
const handleRateLimit = async (email: string, token: string, time: number, type: "RESET_PASSWORD" | "VERIFY_EMAIL") => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const count = await AuthTokenModel.countDocuments({
        email,
        type: type,
        createdAt: {
            $gte: oneHourAgo
        }
    } as any);

    if (count >= 5) {
      throw new AppError("Too many password reset requests. Please try again later.", 429);
    }

    const latest = await AuthTokenModel.findOne({
        email,
        type,
    } as any).sort({ createdAt: "desc" });

    if (
        latest &&
        Date.now() - new Date(latest.createdAt).getTime() < 60000
    ) {
       throw new AppError("Wait 60 seconds", 429);
    }

    await AuthTokenModel.updateMany({
        email,
        type,
        isUsed: false
    },{
        $set: { isUsed: true }
    });

    const result = await AuthTokenModel.create({
        token,
        type,
        email,
        expiresAt: new Date(Date.now() + time * 60 * 1000)
    })

    return result;
}

const registerService = async (email: string, password: string, fullName: string, otp: string) => {

    // check email existed
    const emailExists = await UserModel.findOne({ email });
    if (emailExists) {
        throw new AppError("Email already exists", 400);
    } 

    const otpRecord = await AuthTokenModel.find({
        email,
        token: otp,
        isUsed: false,
        type: "VERIFY_EMAIL",
        expiresAt: { $gt: new Date() },
    })
    if (!otpRecord) {
        throw new AppError("Invalid or expired OTP", 400);
    }

    await AuthTokenModel.updateMany({email,type: "VERIFY_EMAIL",isUsed: false},{$set: {isUsed: true}})

    const newPassword = await hashPassword(password);
    
    const user = await UserModel.create({
        fullName: fullName,
        email: email,
        password: newPassword!,
        avatar:"",
        isVerified: true,
    })

    return {
        message: "User registered successfully",
    }

    
}

const loginService = async (email: string, password: string) => {
    const user = await UserModel.findOne({ email });
    if (!user) {
        throw new AppError("User not found", 404);
    }
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
        throw new AppError("Invalid password", 401);
    }
    const payload = {
        userId: user._id.toString(),
        email: user.email,
    }
    const accessToken = generateToken(payload);
    const refreshToken = generateRefreshToken();
    await RefreshTokenModel.create({
        user: user._id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    })
    
    return {accessToken,refreshToken}
}

const sendOtpService = async (email: string) => {
    const emailExists = await isEmailExists(email);
    if(emailExists) {
        throw new AppError("Email already exists.", 400, [{field: "email", message: "Email already exists."}]);
    }

  // tạo OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const time = +process.env.TIME_LIMIT_OTP!;

    const result = handleRateLimit(email, otp, time, "VERIFY_EMAIL");

  return result;
    
}

const forgotPasswordService = async (email: string) => {
    const emailExists = await isEmailExists(email);
    if(!emailExists) {
        throw new AppError("Email not found.", 404, [{field: "email", message: "Email not found."}]);
    }

  // tạo OTP
    const token = crypto.randomBytes(32).toString("hex");

    const time = +process.env.RATE_LIMIT_FORGOT_PASSWORD!;

    const result = await handleRateLimit(email, token, time, "RESET_PASSWORD");

  

  return result;
    
}

const resetPasswordService = async (token: string, password: string) => {
    const tokenRecord = await AuthTokenModel.findOne({
        token,
        isUsed: false,
        type: "RESET_PASSWORD",
        expiresAt: { $gt: new Date() },
    })
    if (!tokenRecord) {
        throw new AppError("Invalid or expired token", 400);
    }
    const newPassword = await hashPassword(password);
    await UserModel.updateOne({ email: tokenRecord.email }, { $set: { password: newPassword! } })
    await AuthTokenModel.updateOne({ token }, { $set: { isUsed: true } })
    return {
        message: "Password reset successfully",
    }
}

const refreshTokenService = async (refreshToken: string) => {
    const tokenRecord = await RefreshTokenModel.findOne({
        token: refreshToken,
        revoked: false,
        expiresAt: { $gt: new Date() }
    }).populate("user", "_id email")
    .lean() as RefreshTokenWithUser | null;
    if (!tokenRecord) {
        throw new AppError("Invalid or expired token", 400);
    }
    if (tokenRecord.revoked){
        throw new AppError("Refresh token revoked", 401);
    }
    const user = tokenRecord.user;
    const payload = {
        userId: user._id.toString(),
        email: user.email,
    }
    const accessToken = generateToken(payload);
    return {accessToken}
}

const logoutService = async (userId: string, refreshToken: string) => {
    const result = await RefreshTokenModel.updateMany({
        user: userId,
        token: refreshToken,
        revoked: false,
        expiresAt: { $gt: new Date() }
    },{
        revoked: true
    })
    if (result.modifiedCount == 0) {
        throw new AppError("Invalid refresh token or already logged out.", 404);
    }
    return {
        message: "Logout successfully"
    }
}
export { registerService, loginService,sendOtpService,
    forgotPasswordService,resetPasswordService,refreshTokenService,logoutService }