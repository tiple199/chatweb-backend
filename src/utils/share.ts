import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import 'dotenv/config';
import crypto from "crypto";

const saltRounds = 10;
const hashPassword = async (planText: string) => {
    return await bcrypt.hash(planText, saltRounds);
}

const comparePassword = async (planText: string, hashed: string) => {
    return await bcrypt.compare(planText, hashed);
}


const generateToken = (payload:  {userId: string,email: string}) => {
  const secretKey: string = process.env.JWT_SECRET!;
  const expiresIn: any = process.env.JWT_EXPIRES_IN;
  return jwt.sign(payload,secretKey,{expiresIn: expiresIn});
};

const generateRefreshToken = () => {
  return crypto.randomBytes(40).toString("hex");
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export {hashPassword, comparePassword,generateToken,generateRefreshToken,delay}