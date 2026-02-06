import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    createPost,
    getPosts,
    getPost,
    updatePost,
    deletePost,
    getUserPosts,
    getPostsByCategory,
} from "../controllers/post.controller.js";
import {
    toggleLike,
    getUserLikes,
    getPostLikes,
    checkLikeStatus,
} from "../controllers/like.controller.js";
import { postRateLimiter } from "../middlewares/post.rateLimiter.middleware.js";

const postRouter = Router();

// Create post
postRouter
    .route("/create-post")
    .post(verifyJWT,postRateLimiter, upload.single("image"), createPost);

// Get all posts (public)
postRouter.route("/").get(getPosts);

// Get user's own posts
postRouter.route("/user/posts").get(verifyJWT, getUserPosts);

// Get posts liked by current user
postRouter.route("/user/likes").get(verifyJWT, getUserLikes);

// Get posts by category
postRouter.route("/category/:category").get(getPostsByCategory);

// Get, update, delete specific post
postRouter
    .route("/:postId")
    .get(getPost)
    .put(verifyJWT, updatePost)
    .delete(verifyJWT, deletePost);

// Like operations
postRouter
    .route("/:postId/like")
    .post(verifyJWT, toggleLike)
    .get(verifyJWT, checkLikeStatus);

// Get users who liked a post
postRouter.route("/:postId/likes").get(getPostLikes);

export default postRouter;
