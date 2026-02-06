import { Router } from "express";
import { initiateLogin, oauthCallback, getUser, logout } from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authRateLimiter } from "../middlewares/auth.rateLimiter.middleware.js";

const userRouter = Router();

// Azure AD OAuth2 routes
userRouter.route("/oauth/login").get(authRateLimiter,initiateLogin);
userRouter.route("/oauth/callback").get(authRateLimiter,oauthCallback);

// Protected routes
userRouter.route("/get-user").get(verifyJWT, getUser);
userRouter.route("/logout").post(verifyJWT, logout);

export default userRouter;
