import {asyncHandler} from "../utils/asyncHandler.js"

const sendEmail=asyncHandler(async(req,res)=>{
    res.send("send email")
})

export {sendEmail}