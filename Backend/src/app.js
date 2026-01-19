import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app=express()

// behind Render's proxy in production (enables secure cookies, correct protocol)
if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1)
}

//middlewares

// Allow comma-separated origins via CORS_ORIGIN (e.g. https://app.com,https://admin.app.com)
const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim()).filter(Boolean)
    : []

// In production, use strict origin checking; in dev, allow all origins for testing
const corsOrigin = process.env.NODE_ENV === "production" && allowedOrigins.length 
    ? allowedOrigins 
    : true; // true allows all origins

app.use(cors({
    origin: corsOrigin,
    credentials: true,
    exposedHeaders: ['Set-Cookie'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}))

app.use(express.json({
    limit:"16kb"
}))

app.use(express.urlencoded({
    extended:true,
    limit:"16kb"
}))

app.use(express.static("public"))

app.use(cookieParser())

//Routes

import userRouter from "./routes/user.route.js"
import postRouter from "./routes/post.route.js"
import commentRouter from "./routes/comment.route.js"
import reportRouter from "./routes/report.route.js"

app.use("/api/v1/users",userRouter)
app.use("/api/v1/posts",postRouter)
app.use("/api/v1/comments",commentRouter)
app.use("/api/v1/reports",reportRouter)

// Health check for Render
app.get("/healthz", (req, res) => {
    res.status(200).send("ok")
})

export {app}