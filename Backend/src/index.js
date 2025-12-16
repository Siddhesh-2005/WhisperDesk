import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

//the env is loaded first
dotenv.config({
    path: "./.env",
});


//when the index.js starts it first connects the db 
connectDB()
    .then(() => {
        app.listen(process.env.PORT || 8000, () => {
            console.log(`Server is running on port ${process.env.PORT}`);
        });
    })
    .catch((err) => {
        console.log("MONGODB connection FAILED....", err);
    });
