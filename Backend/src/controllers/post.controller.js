import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { Post } from "../models/post.model.js";
import {postModerationQueue} from "../queues/postModeration.queue.js"
import redisClient from "../db/redis.upstash.js"

// const createPost = asyncHandler(async (req, res) => {
//     const { title, content } = req.body;

//     const authorId = req.user._id;

//     //const image=req.file

//     if ([title, content].some((field) => field?.trim() === "")) {
//         console.log("validation error");
//         throw new ApiError(400, "All fields are required");
//     }

//     const imageLocalPath = req.file?.path;

//     //console.log(imageLocalPath);

//     const image = await uploadOnCloudinary(imageLocalPath);

//     //console.log(image.url);

//     const post = await Post.create({
//         authorId: authorId,
//         title: title,
//         content: content,
//         image: image,
//     });

//     const postId=post._id
//     const moderation=await postModerationQueue.add("moderate-post",{postId:postId})

//     //console.log(moderation);
    

//     return res.status(200).json(new ApiResponse(200, post, "Post created successfully"));
// });

const createPost = asyncHandler(async (req, res) => {
    const { title, content, category} = req.body; 
    const authorId = req.user._id;

    if (!content || content.trim() === "") {
        throw new ApiError(400, "Content is required");
    }

 
    const post = await Post.create({
        authorId,
        title,
        content,
        category: category || "general",
        status: "PENDING_MODERATION",
    });


    await postModerationQueue.add(
        "moderate-post", 
        { 
            postId: post._id, 
            imagePath: req.file?.path 
        },
        {
            attempts: 5,
            backoff: { type: 'exponential', delay: 2000 }
        }
    );

    return res
        .status(201)
        .json(new ApiResponse(201, { postId: post._id }, "Post submitted. It will appear after moderation."));
});

// Get all published posts
const getPosts = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { category, search } = req.query;

    const filter = {
        status: "PUBLISHED",
        isDeleted: false
    };

    if (category) {
        filter.category = category;
    }

    if (search) {
        filter.$or = [
            { title: { $regex: search, $options: "i" } },
            { content: { $regex: search, $options: "i" } }
        ];
    }

    const posts = await Post.find(filter)
        .populate("authorId", "username branch")
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

    const totalPosts = await Post.countDocuments(filter);

    const pagination = {
        currentPage: page,
        totalPages: Math.ceil(totalPosts / limit),
        totalPosts,
        hasNextPage: page < Math.ceil(totalPosts / limit),
        hasPrevPage: page > 1
    };

    return res.status(200).json(
        new ApiResponse(200, { posts, pagination }, "Posts retrieved successfully")
    );
});

// Get single post by ID
const getPost = asyncHandler(async (req, res) => {
    const { postId } = req.params;

    if (!postId) {
        throw new ApiError(400, "Post ID is required");
    }

    const post = await Post.findOne({
        _id: postId,
        status: "PUBLISHED",
        isDeleted: false
    }).populate("authorId", "username branch").lean();

    if (!post) {
        throw new ApiError(404, "Post not found");
    }

    return res.status(200).json(
        new ApiResponse(200, post, "Post retrieved successfully")
    );
});

// Update post
const updatePost = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const { title, content, category } = req.body;
    const userId = req.user._id;

    if (!postId) {
        throw new ApiError(400, "Post ID is required");
    }

    const post = await Post.findById(postId);

    if (!post) {
        throw new ApiError(404, "Post not found");
    }

    // Check if user is the author
    if (post.authorId.toString() !== userId.toString()) {
        throw new ApiError(403, "You can only edit your own posts");
    }

    // Only allow editing if post is published or rejected
    if (!["PUBLISHED", "REJECTED"].includes(post.status)) {
        throw new ApiError(400, "Cannot edit post while it's under moderation");
    }

    if (title !== undefined) post.title = title;
    if (content !== undefined) post.content = content;
    if (category !== undefined) post.category = category;

    // If post was published, set to pending moderation again
    if (post.status === "PUBLISHED") {
        post.status = "PENDING_MODERATION";
        await post.save();

        // Re-queue for moderation
        await postModerationQueue.add(
            "moderate-post",
            { postId: post._id },
            {
                attempts: 5,
                backoff: { type: 'exponential', delay: 2000 }
            }
        );
    } else {
        await post.save();
    }

    return res.status(200).json(
        new ApiResponse(200, post, "Post updated successfully")
    );
});

// Delete post
const deletePost = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const userId = req.user._id;

    if (!postId) {
        throw new ApiError(400, "Post ID is required");
    }

    const post = await Post.findById(postId);

    if (!post) {
        throw new ApiError(404, "Post not found");
    }

    // Check if user is the author
    if (post.authorId.toString() !== userId.toString()) {
        throw new ApiError(403, "You can only delete your own posts");
    }

    // Soft delete
    post.isDeleted = true;
    await post.save();

    // Clean up Redis
    if (redisClient.isOpen) {
        const postLikesKey = `post:likes:${postId}`;
        const initKey = `post:likes:init:${postId}`;
        await redisClient.del([postLikesKey, initKey]);
    }

    return res.status(200).json(
        new ApiResponse(200, {}, "Post deleted successfully")
    );
});

// Get user's own posts
const getUserPosts = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find({
        authorId: userId,
        isDeleted: false
    })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

    const totalPosts = await Post.countDocuments({
        authorId: userId,
        isDeleted: false
    });

    const pagination = {
        currentPage: page,
        totalPages: Math.ceil(totalPosts / limit),
        totalPosts,
        hasNextPage: page < Math.ceil(totalPosts / limit),
        hasPrevPage: page > 1
    };

    return res.status(200).json(
        new ApiResponse(200, { posts, pagination }, "User posts retrieved successfully")
    );
});

// Get posts by category
const getPostsByCategory = asyncHandler(async (req, res) => {
    const { category } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const validCategories = ["confession", "academics", "career", "relationships", "rant", "help", "general"];
    
    if (!validCategories.includes(category)) {
        throw new ApiError(400, "Invalid category");
    }

    const posts = await Post.find({
        category,
        status: "PUBLISHED",
        isDeleted: false
    })
        .populate("authorId", "username")
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

    const totalPosts = await Post.countDocuments({
        category,
        status: "PUBLISHED",
        isDeleted: false
    });

    const pagination = {
        currentPage: page,
        totalPages: Math.ceil(totalPosts / limit),
        totalPosts,
        hasNextPage: page < Math.ceil(totalPosts / limit),
        hasPrevPage: page > 1
    };

    return res.status(200).json(
        new ApiResponse(200, { posts, pagination }, `Posts in ${category} retrieved successfully`)
    );
});

export { createPost, getPosts, getPost, updatePost, deletePost, getUserPosts, getPostsByCategory };
