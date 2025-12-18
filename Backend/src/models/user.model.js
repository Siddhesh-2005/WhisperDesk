import mongoose, { model, Schema } from "mongoose";
import jwt from "jsonwebtoken"

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

//method to generate access token
userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
        }
    );
};

export const User = model("User", userSchema);
