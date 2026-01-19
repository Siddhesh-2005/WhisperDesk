import { Router } from "express";
import {login, sendEmail,getUser, logout, testCookie} from "../controllers/user.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const userRouter=Router()

userRouter.route("/send-email").post(sendEmail)

userRouter.route("/login").get(login)

userRouter.route("/get-user").get(verifyJWT,getUser)

userRouter.route("/logout").post(verifyJWT, logout)

userRouter.route("/test-cookie").get(testCookie)

export default userRouter