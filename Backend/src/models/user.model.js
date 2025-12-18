import mongoose, { model, Schema } from "mongoose";

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            trim: true,
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        branch: {
            type: String,
            required: true,
        },

        isActive: {
            type: Boolean,
            default: true,
        },

        emailVerification: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

export const User = model("User", userSchema);
