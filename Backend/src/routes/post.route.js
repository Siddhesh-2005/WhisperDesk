import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { createPost } from "../controllers/post.controller.js";
import {toggleLike} from "../controllers/like.controller.js"

const postRouter= Router()

postRouter.route("/create-post").post(verifyJWT,upload.single("image"),createPost)

postRouter.route("/:postId/like").post(verifyJWT,toggleLike)

export default postRouter