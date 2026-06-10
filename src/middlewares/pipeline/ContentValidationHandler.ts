import { Response, NextFunction } from "express";
import { AuthRequest } from "../../types/custom";
import { RequestHandler } from "./BaseHandler";
import AppError from "../../utils/appError";

export class MessageContentValidationHandler extends RequestHandler {
  public async handle(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    const content = req.body.Content || req.body.content || "";

    if (!content.trim() && !req.file) {
      return next(new AppError('Message content is required', 400));
    }

    (req as any).content = content;

    await super.handle(req, res, next);
  }
}
