import { InferSchemaType, model, Schema } from "mongoose";


const authTokenSchema = new Schema(
    {
        email: {type:String,required:true},
        type: {type:String,
            enum:["RESET_PASSWORD","VERIFY_EMAIL"],
            default: "VERIFY_EMAIL"
        },
        token: {type:String,required:true},
        isUsed: {type:Boolean,default:false},
        expiresAt: {type:Date,required:true}
    },
    {timestamps: true}
)
authTokenSchema.index({ email: 1, type: 1, createdAt: 1 });

export type AuthTokenDocument = InferSchemaType<typeof authTokenSchema>
export const AuthTokenModel = model("AuthToken", authTokenSchema)