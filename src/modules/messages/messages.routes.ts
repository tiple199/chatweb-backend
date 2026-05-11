import { Express } from "express"; // Import kiểu dữ liệu từ express
import * as messageController from "./messages.controller";
import { checkValidJWT } from "../../middlewares/jwt.middleware";

const messageRoute = (app: Express) => {
  // Đăng ký route lấy lịch sử chat
  app.get("/api/messages/:conversationId", checkValidJWT as any, messageController.getHistory);
};

export default messageRoute;