import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
    {
        authorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        title: {
            type: String,
            trim: true,
            maxlength: 150,
        },
        content: {
            type: String,
            required: true,
            trim: true,
            maxlength: 5000,
        },
        image: {
            url: { type: String },
            publicId: { type: String }, 
        },
        status: {
            type: String,
            enum: ["PENDING_MODERATION", "NEEDS_REVIEW", "PUBLISHED", "REJECTED"],
            default: "PENDING_MODERATION",
            index: true,
        },
        moderation: {
            // Record the exact pipeline path
            path: { 
                type: String, 
                enum: ["REGEX", "PERSPECTIVE", "GROQ", "HUMAN"],
                default: "REGEX"
            },
            
            reason: { 
                type: String, 
                default: "" 
            },

            scores: {
                type: Map,
                of: Number, // Stores { toxicity: 0.8, insult: 0.2 }
            },

            // RAW response from Gemini for debugging
            aiMetadata: { type: mongoose.Schema.Types.Mixed },

            reviewedByHuman: {
                type: Boolean,
                default: false,
            },
            moderatedAt: {
                type: Date,
            },
        },
        publishedAt: {
            type: Date,
            index: true,
        },
        category: {
            type: String,
            enum: ["confession", "academics", "career", "relationships", "rant", "help", "general"],
            index: true,
            required: true, 
        },
        tags: {
            type: [String],
            default: [],
            index: true,
        },
        // Social Stats
        likesCount: { type: Number, default: 0 },
        commentsCount: { type: Number, default: 0 },
        reportsCount: { type: Number, default: 0, index: true }, // Index to find toxic posts fast
        
        isDeleted: {
            type: Boolean,
            default: false,
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

postSchema.index({ status: 1, category: 1, isDeleted: 1, createdAt: -1 });

export const Post = mongoose.model("Post", postSchema);