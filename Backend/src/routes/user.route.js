import { Router } from "express";
import {login, sendEmail} from "../controllers/user.controller.js"

const userRouter=Router()

userRouter.route("/send-email").get(sendEmail)

userRouter.route("/login").get(login)

export default userRouter