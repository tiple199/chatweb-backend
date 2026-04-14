import { Schema, model, Types, InferSchemaType } from "mongoose";

const conversationSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["private", "group"],
      default: "private"
    },
    members: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
    name: { type: String, default: "" },
    lastMessageId: { type: Schema.Types.ObjectId, ref: "Message", default: null }
  },
  { timestamps: true }
);

export type ConversationDocument = InferSchemaType<typeof conversationSchema>;
export const ConversationModel = model("Conversation", conversationSchema);