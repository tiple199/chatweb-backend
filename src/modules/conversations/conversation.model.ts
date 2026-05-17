import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPollOption {
  _id?: Types.ObjectId;
  text: string;
  voters: Types.ObjectId[];
}

export interface IPoll {
  _id?: Types.ObjectId;
  question: string;
  options: IPollOption[];
  createdBy: Types.ObjectId;
  isActive: boolean;
}

export interface INote {
  _id?: Types.ObjectId;
  content: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
}

export interface IConversation extends Document {
  chatName: string;
  isGroupChat: boolean;
  users: Types.ObjectId[];
  latestMessage?: Types.ObjectId;
  groupAdmins: Types.ObjectId[];
  polls: IPoll[];
  notes: INote[];
}

const conversationSchema = new Schema<IConversation>(
  {
    chatName: { type: String, trim: true },
    isGroupChat: { type: Boolean, default: false },
    users: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    latestMessage: { type: Schema.Types.ObjectId, ref: 'Message' },
    groupAdmins: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    polls: [
      {
        question: { type: String, required: true },
        options: [
          {
            text: { type: String, required: true },
            voters: [{ type: Schema.Types.ObjectId, ref: 'User' }]
          }
        ],
        createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
        isActive: { type: Boolean, default: true }
      }
    ],
    notes: [
      {
        content: { type: String, required: true },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
        createdAt: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

export default mongoose.model<IConversation>('Conversation', conversationSchema);