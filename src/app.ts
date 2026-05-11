import express from "express";
import cors from "cors";
import path from "path"; // Import để xử lý đường dẫn thư mục
import errorHandler from "./middlewares/error.middleware";
import authRoute from "./modules/auth/auth.route";
import userRoute from "./modules/users/user.route";
import messageRoute from "./modules/messages/messages.routes"; 

export const app = express();

// 1. Middleware cơ bản
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: true}));

/**
 * 2. Cấu hình Static File (QUAN TRỌNG)
 * Giúp trình duyệt có thể truy cập trực tiếp file ảnh qua URL.
 * Ví dụ: http://localhost:5000/uploads/avatars/avatar-xxx.jpg
 */
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// 3. Khai báo các Route
authRoute(app);
userRoute(app);
messageRoute(app); 

// 4. Xử lý lỗi 404 cho các Endpoint không tồn tại
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Endpoint not found."
    });
});

// 5. Middleware xử lý lỗi tập trung (Error Handler)
app.use(errorHandler);