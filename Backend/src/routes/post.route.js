import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { createPost } from "../controllers/post.controller.js";

const postRouter= Router()

postRouter.route("/create-post").post(verifyJWT,upload.single("image"),createPost)

export default postRouter