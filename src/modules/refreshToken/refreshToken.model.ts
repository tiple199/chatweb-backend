import { InferSchemaType, model, Schema } from "mongoose"
import { UserDocument } from "../users/user.model";

const refreshTokenSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    token: {
        type: String,
        required: true
    },
    expiresAt: {
        type: Date,
        required: true
    },
    revoked: {
        type: Boolean,
        default: false
    },
    
}, { timestamps: true })

export type RefreshTokenDocument = InferSchemaType<typeof refreshTokenSchema>
export type RefreshTokenWithUser = RefreshTokenDocument & {
  user: UserDocument;
};
export const RefreshTokenModel = model("RefreshToken", refreshTokenSchema)