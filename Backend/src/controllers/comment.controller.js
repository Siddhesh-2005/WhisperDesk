import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Comment } from "../models/comment.model.js";
import { Post } from "../models/post.model.js";
import mongoose from "mongoose";

// Create a new comment
export const createComment = asyncHandler(async (req, res) => {
    const { content } = req.body;
    const { postId } = req.params;
    const authorId = req.user._id;

    if (!content || content.trim() === "") {
        throw new ApiError(400, "Comment content is required");
    }

    if (!postId || !mongoose.Types.ObjectId.isValid(postId)) {
        throw new ApiError(400, "Valid post ID is required");
    }

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
        throw new ApiError(404, "Post not found");
    }

    const comment = await Comment.create({
        postId,
        authorId,
        content: content.trim()
    });

    // Update comment count in the post
    await Post.findByIdAndUpdate(postId, { $inc: { commentsCount: 1 } });

    // Populate the author information for response
    const populatedComment = await Comment.findById(comment._id)
        .populate('authorId', 'username')
        .lean();

    return res.status(201).json(
        new ApiResponse(201, populatedComment, "Comment created successfully")
    );
});

// Get comments for a specific post
export const getPostComments = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    if (!postId || !mongoose.Types.ObjectId.isValid(postId)) {
        throw new ApiError(400, "Valid post ID is required");
    }

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
        throw new ApiError(404, "Post not found");
    }

    const comments = await Comment.find({ 
        postId, 
        isHidden: false 
    })
    .populate('authorId', 'username')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

    const totalComments = await Comment.countDocuments({ 
        postId, 
        isHidden: false 
    });

    const pagination = {
        currentPage: page,
        totalPages: Math.ceil(totalComments / limit),
        totalComments,
        hasNextPage: page < Math.ceil(totalComments / limit),
        hasPrevPage: page > 1
    };

    return res.status(200).json(
        new ApiResponse(200, {
            comments,
            pagination
        }, "Comments retrieved successfully")
    );
});

// Get a specific comment
export const getComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    if (!commentId || !mongoose.Types.ObjectId.isValid(commentId)) {
        throw new ApiError(400, "Valid comment ID is required");
    }

    const comment = await Comment.findOne({
        _id: commentId,
        isHidden: false
    }).populate('authorId', 'username').lean();

    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    return res.status(200).json(
        new ApiResponse(200, comment, "Comment retrieved successfully")
    );
});

// Update a comment
export const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    if (!commentId || !mongoose.Types.ObjectId.isValid(commentId)) {
        throw new ApiError(400, "Valid comment ID is required");
    }

    if (!content || content.trim() === "") {
        throw new ApiError(400, "Comment content is required");
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    // Check if user is the author of the comment
    if (comment.authorId.toString() !== userId.toString()) {
        throw new ApiError(403, "You can only edit your own comments");
    }

    comment.content = content.trim();
    await comment.save();

    const updatedComment = await Comment.findById(commentId)
        .populate('authorId', 'username')
        .lean();

    return res.status(200).json(
        new ApiResponse(200, updatedComment, "Comment updated successfully")
    );
});

// Delete a comment
export const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const userId = req.user._id;

    if (!commentId || !mongoose.Types.ObjectId.isValid(commentId)) {
        throw new ApiError(400, "Valid comment ID is required");
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    // Check if user is the author of the comment
    if (comment.authorId.toString() !== userId.toString()) {
        throw new ApiError(403, "You can only delete your own comments");
    }

    await Comment.findByIdAndDelete(commentId);

    return res.status(200).json(
        new ApiResponse(200, {}, "Comment deleted successfully")
    );
});

// Hide/Show a comment (for moderation purposes)
export const toggleCommentVisibility = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const userId = req.user._id;

    if (!commentId || !mongoose.Types.ObjectId.isValid(commentId)) {
        throw new ApiError(400, "Valid comment ID is required");
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    // Check if user is the author of the comment
    if (comment.authorId.toString() !== userId.toString()) {
        throw new ApiError(403, "You can only modify your own comments");
    }

    comment.isHidden = !comment.isHidden;
    await comment.save();

    const updatedComment = await Comment.findById(commentId)
        .populate('authorId', 'username')
        .lean();

    return res.status(200).json(
        new ApiResponse(
            200, 
            updatedComment, 
            `Comment ${comment.isHidden ? 'hidden' : 'shown'} successfully`
        )
    );
});

// Get user's comments
export const getUserComments = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const comments = await Comment.find({ 
        authorId: userId 
    })
    .populate('postId', 'title')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

    const totalComments = await Comment.countDocuments({ 
        authorId: userId 
    });

    const pagination = {
        currentPage: page,
        totalPages: Math.ceil(totalComments / limit),
        totalComments,
        hasNextPage: page < Math.ceil(totalComments / limit),
        hasPrevPage: page > 1
    };

    return res.status(200).json(
        new ApiResponse(200, {
            comments,
            pagination
        }, "User comments retrieved successfully")
    );
});

// Get comment count for a post
export const getCommentCount = asyncHandler(async (req, res) => {
    const { postId } = req.params;

    if (!postId || !mongoose.Types.ObjectId.isValid(postId)) {
        throw new ApiError(400, "Valid post ID is required");
    }

    const commentCount = await Comment.countDocuments({ 
        postId, 
        isHidden: false 
    });

    return res.status(200).json(
        new ApiResponse(200, { commentCount }, "Comment count retrieved successfully")
    );
});