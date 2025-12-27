import { Router } from "express";
import {login, sendEmail,getUser} from "../controllers/user.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const userRouter=Router()

userRouter.route("/send-email").get(sendEmail)

userRouter.route("/login").get(login)

userRouter.route("/get-user").get(verifyJWT,getUser)

export default userRouter