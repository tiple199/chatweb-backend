import { Response, NextFunction } from "express";
import { AuthRequest } from "../../types/custom";

export abstract class RequestHandler {
  private nextHandler?: RequestHandler;

  public setNext(handler: RequestHandler): RequestHandler {
    this.nextHandler = handler;
    return handler; // Cho phép chain obj.setNext().setNext()
  }

  public async handle(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    if (this.nextHandler) {
      await this.nextHandler.handle(req, res, next);
    } else {
      next(); // Pass chain, chuyển sang controller
    }
  }
}
