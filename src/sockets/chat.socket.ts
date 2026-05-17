import { Server, Socket } from 'socket.io';

// --- Định nghĩa Interface để loại bỏ 'any' ---
interface UserSetupData {
  userId: string; 
}

interface NewMessageData {
  conversationId: string;
  // Khai báo thêm các trường của Message nếu bạn muốn strict hơn
  [key: string]: unknown; 
}

interface UpdateGroupData {
  conversationId: string;
  [key: string]: unknown;
}

export const chatSocket = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    
    // Khởi tạo user tham gia vào phòng riêng của họ (nhận noti tổng)
    socket.on('setup', (userData: UserSetupData) => {
      if (userData.userId) {
        socket.join(userData.userId);
        socket.emit('connected');
      }
    });

    // Tham gia vào một đoạn chat cụ thể (1-1 hoặc Nhóm)
    socket.on('join_conversation', (room: string) => {
      if (room) {
        socket.join(room);
      }
    });

    // 1. Nhắn tin (Text, File, Video)
    socket.on('new_message', (newMessage: NewMessageData) => {
      const chat = newMessage.conversationId;
      if (!chat) return;
      
      // Gửi cho tất cả mọi người trong phòng TRỪ người gửi
      socket.in(chat).emit('message_received', newMessage);
    });

    // 2. Bình chọn cập nhật
    socket.on('poll_updated', (updateData: UpdateGroupData) => {
      socket.in(updateData.conversationId).emit('poll_received', updateData);
    });

    // 3. Ghi chú mới
    socket.on('note_added', (noteData: UpdateGroupData) => {
      socket.in(noteData.conversationId).emit('note_received', noteData);
    });

    // 4. Update thành viên nhóm (Kick, add, leave)
    socket.on('group_updated', (groupData: UpdateGroupData) => {
      socket.in(groupData.conversationId).emit('participants_updated', groupData);
    });

    socket.on('disconnect', () => {
      // Có thể log hoặc xử lý trạng thái offline tại đây
      console.log('User disconnected:', socket.id);
    });
  });
};