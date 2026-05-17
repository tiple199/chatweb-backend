import { Server } from "socket.io";
import { Multer } from "multer";

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
      };
      io: Server;
      file?: Multer.File;
    }
    namespace Multer {
      interface File {
        fieldname: string;
        originalname: string;
        encoding: string;
        mimetype: string;
        size: number;
        destination: string;
        filename: string;
        path: string;
      }
    }
  }
}