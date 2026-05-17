import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IMessage extends Document {
  sender: Types.ObjectId;
  content: string;
  conversationId: Types.ObjectId;
  messageType: 'text' | 'image' | 'video' | 'file';
  fileUrl?: string; // Link file/ảnh/video lưu trên Cloudinary/S3
  fileName?: string;
}

const messageSchema = new Schema<IMessage>(
  {
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, trim: true },
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
    messageType: { 
      type: String, 
      enum: ['text', 'image', 'video', 'file'], 
      default: 'text' 
    },
    fileUrl: { type: String },
    fileName: { type: String }
  },
  { timestamps: true }
);

export const MessageModel = mongoose.model<IMessage>('Message', messageSchema);
export default MessageModel;