import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    createComment,
    getPostComments,
    getComment,
    updateComment,
    deleteComment,
    toggleCommentVisibility,
    getUserComments,
    getCommentCount
} from "../controllers/comment.controller.js";

const commentRouter = Router();

// Create a comment on a post
commentRouter.route("/posts/:postId").post(verifyJWT, createComment);

// Get all comments for a specific post
commentRouter.route("/posts/:postId").get(getPostComments);

// Get comment count for a specific post
commentRouter.route("/posts/:postId/comments/count").get(getCommentCount);

// Get a specific comment
commentRouter.route("/:commentId").get(getComment);

// Update a specific comment
commentRouter.route("/:commentId").put(verifyJWT, updateComment);

// Delete a specific comment
commentRouter.route("/:commentId").delete(verifyJWT, deleteComment);

// Toggle comment visibility (hide/show)
commentRouter.route("/:commentId/visibility").put(verifyJWT, toggleCommentVisibility);

// Get all comments by the authenticated user
commentRouter.route("/user/comments").get(verifyJWT, getUserComments);

export default commentRouter;