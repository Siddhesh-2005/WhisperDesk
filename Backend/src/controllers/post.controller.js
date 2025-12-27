import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { Post } from "../models/post.model.js";
import {postModerationQueue} from "../queues/postModeration.queue.js"
import redisClient from "../db/redis.js"

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

export { createPost };
