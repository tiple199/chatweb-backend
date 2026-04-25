
import { AsyncHandler } from "@/types/asyncHandler";
import { Request, Response, NextFunction } from "express";



const asyncHandler = (fn: AsyncHandler) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default asyncHandler;