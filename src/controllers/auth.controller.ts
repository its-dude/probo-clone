import { Request, Response } from "express"
import { success, z } from "zod"
import { authServices } from "../services/index.services"


const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).+$/

const passwordSchema = z.string()
    .min(6, { message: "Password must be at least 6 characters" })
    .regex(passwordRegex, { message: "Password must contain uppercase, lowercase, number, and special character" })


const signupSchema = z.object({
    firstName: z.string().min(2),
    lastName: z.string().min(2),
    email: z.email(),
    password: passwordSchema
})

const signinSchema = z.object({
    email: z.email(),
    password: passwordSchema
})

export const signup = async (req: Request, res: Response) => {
    const requestBody = signupSchema.safeParse(req.body)

    if (!requestBody.success) {
        const errors = requestBody.error.issues.map(err => ({
            field: err.path[0],
            message: err.message
        }));

        return res.status(400).json({ success: false, errors });
    }

    try {
        await authServices.signup(requestBody.data)

        return res.status(201).json({ success: true, message: "Signup successful" })
    } catch (err: any) {
        return res.status(400).json({ success: false, message: err.message })
    }
}

export const signin = async (req: Request, res: Response) => {
    const requestBody = signinSchema.safeParse(req.body)

    if (!requestBody.success) {
        const errors = requestBody.error.issues.map((err)=> ({
            field: err.path[0],
            mesage: err.message
        }) )

        return res.status(400).json({success: false, errors})
    }

    try{
        const result = await authServices.signin(requestBody.data)

        return res.status(200).json({success: true, message: "Signin successful", token: result.token})
    } catch (err: any) {
        return res.status(401).json({success: false, message: err.message })
    }
}
