
import AppError from "@/utils/appError";
import { Request, Response, NextFunction } from "express";

const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(err);

  //  lỗi có kiểm soát
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors || null,
    });
  }

  //  lỗi không xác định
  return res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
};

export default errorHandler;