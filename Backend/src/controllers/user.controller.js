import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import { sendEmail as send } from "../utils/mailer.js"
import { validateCollegeEmail } from "../services/validateEmail.service.js"
import { User } from "../models/user.model.js"
import { generateUniqueUsername } from "../services/generateUsername.service.js"
import { createMagicToken } from "../services/magicToken.service.js"

const sendEmail = asyncHandler(async (req, res) => {
    const { incomingEmail } = req.body

    const email = validateCollegeEmail(incomingEmail)
    if (!email.isValid) {
        throw new ApiError(400, "Invalid college email")
    }

    let user = await User.findOne({ email: incomingEmail })

    // if user does not exist → create
    if (!user) {
        const username = await generateUniqueUsername()
        if (!username) {
            throw new ApiError(500, "Unable to generate username")
        }

        user = await User.create({
            username,
            email: incomingEmail,
            branch: email.branch,
            isActive: true,
            emailVerification: true
        })
    }

    const userId = user._id.toString()

    const rawToken= await createMagicToken(userId)

    if (!rawToken) {
        throw new ApiError(500,"Unable to generate magic token")
    }

    const url="http://localhost:8000/api/v1/users/verify?magictoken="+rawToken

    send(incomingEmail,url)

    return res.status(200).json(
        new ApiResponse(200,  "Email sent successfully")
    )
})

export {sendEmail}