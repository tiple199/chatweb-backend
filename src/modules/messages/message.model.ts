import mongoose, { Schema, Document, Types } from 'mongoose';


export interface IMessage extends Document {
  sender: Types.ObjectId;
  content: string;
  conversationId: Types.ObjectId;
  messageType: 'text' | 'image' | 'video' | 'file' | 'system' | 'poll';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  isDeletedBySender?: boolean;
  isDeletedForAll?: boolean;
  deletedAt?: Date;
  replyToMessageId?: Types.ObjectId;
  readBy: Types.ObjectId[];
}

const messageSchema = new Schema<IMessage>(
  {
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, trim: true },
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
    messageType: { 
      type: String, 
      enum: ['text', 'image', 'video', 'file', 'system', 'poll'], 
      default: 'text' 
    },
    fileUrl: { type: String },
    fileName: { type: String },
    fileSize: { type: Number },
    mimeType: { type: String },
    isDeletedBySender: { type: Boolean, default: false },
    isDeletedForAll: { type: Boolean, default: false },
    deletedAt: { type: Date },
    replyToMessageId: { type: Schema.Types.ObjectId, ref: 'Message' },
    readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }]
  },
  { timestamps: true }
);

export const MessageModel = mongoose.model<IMessage>('Message', messageSchema);
export default MessageModel;