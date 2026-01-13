import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
    {
        postId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Post",
            required: true,
            index: true,
        },

        authorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref:"User",
            required: true,
            index: true,
        },

        content: {
            type: String,
            required: true,
            trim: true,
            maxlength: 2000,
        },

        isHidden: {
            type: Boolean,
            default: false,
            index: true,
        },
    },
    { timestamps: true }
);

commentSchema.index({ postId: 1, createdAt: -1 });
commentSchema.index({ authorId: 1, createdAt: -1 });

export const Comment = mongoose.model("Comment", commentSchema);
