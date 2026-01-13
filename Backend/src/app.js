import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app=express()

//middlewares

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
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

export {app}