import { NextFunction, Request, Response } from "express"
import jwt from "jsonwebtoken";

const checkValidJWT = (req: Request, res: Response, next: NextFunction) => {
    // const path = req.path;
    // const whiteList = ["/login", "/register","/send-otp","/google-login","/forgot-password","/refresh-token"];
    // if (whiteList.includes(path) ||
    // path.startsWith("/reset-password/")) {
    //     return next();
    // }

    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "Missing token" });
    }

    if (!process.env.JWT_SECRET) {
        return res.status(500).json({ message: "JWT secret is not configured" });
    }

    try {
        const dataDecoded: any = jwt.verify(token, process.env.JWT_SECRET);
        req.user = {
            userId: dataDecoded.userId,
            email: dataDecoded.email
        }
        return next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid token" });
    }

}

export { checkValidJWT }