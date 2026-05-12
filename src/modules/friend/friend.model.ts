import { Schema, model, InferSchemaType } from "mongoose";

const friendSchema = new Schema(
  {
    requester: { type: Schema.Types.ObjectId, ref: "User", required: true },
    recipient: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["pending", "accepted", "blocked"],
      default: "pending"
    }
  },
  { timestamps: true }
);

friendSchema.index({ requester: 1, recipient: 1 }, { unique: true });

export type FriendDocument = InferSchemaType<typeof friendSchema>;
export const FriendModel = model("Friend", friendSchema);