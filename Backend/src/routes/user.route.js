import { Router } from "express";
import {sendEmail} from "../controllers/user.controller.js"

const userRouter=Router()

userRouter.route("/send-email").get(sendEmail)

export default userRouter