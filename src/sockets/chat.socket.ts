import { Server, Socket } from "socket.io";
import { MessageModel } from "../modules/messages/message.model";

// Khai báo kiểu dữ liệu cho dữ liệu tin nhắn gửi lên
interface SendMessageData {
    conversationId: string;
    senderId: string;
    content: string;
    type?: "text" | "image" | "file";
}

export const chatSocket = (io: Server) => {
    io.on("connection", (socket: Socket) => {
        console.log(`User connected: ${socket.id}`);

        // Người dùng tham gia vào phòng chat cụ thể
        socket.on("join_room", (roomId: string) => {
            socket.join(roomId);
        });

        // Lắng nghe sự kiện gửi tin nhắn
        socket.on("send_message", async (data: SendMessageData) => {
            try {
                // 1. Lưu tin nhắn vào Database ngay lập tức [cite: 40, 49]
                const newMessage = await MessageModel.create({
                    conversationId: data.conversationId,
                    senderId: data.senderId,
                    content: data.content,
                    type: data.type || "text"
                });

                // 2. Lấy thông tin người gửi để hiển thị giao diện (fullName, avatar) [cite: 41]
                const populatedMessage = await newMessage.populate("senderId", "fullName avatar");

                // 3. Gửi tin nhắn real-time tới tất cả thành viên trong phòng [cite: 13, 41]
                io.to(data.conversationId).emit("receive_message", populatedMessage);
                
            } catch (error) {
                console.error("Lỗi khi gửi tin nhắn:", error);
                socket.emit("error_message", { message: "Không thể gửi tin nhắn" });
            }
        });

        socket.on("disconnect", () => {
            console.log(`User disconnected: ${socket.id}`);
        });
    });
};