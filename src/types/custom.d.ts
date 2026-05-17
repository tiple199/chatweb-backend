// src/types/custom.d.ts
import { Request } from 'express';

// Khai báo lại Request của express để thêm thuộc tính user giống y hệt jwt.middleware.ts
export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}