import { Schema, model, InferSchemaType } from "mongoose";

const messageSchema = new Schema(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    content: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["text", "image", "file"],
      default: "text"
    },
    seenBy: [{ type: Schema.Types.ObjectId, ref: "User" }]
  },
  { timestamps: true }
);

messageSchema.index({ conversationId: 1, createdAt: -1 });

export type MessageDocument = InferSchemaType<typeof messageSchema>;
export const MessageModel = model("Message", messageSchema);