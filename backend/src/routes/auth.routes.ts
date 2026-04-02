import express from "express"
import { authController } from "../controllers/index.controller"

const authRouter = express.Router()

authRouter.post('/signup', authController.signup)
authRouter.post('/signin', authController.signin)

export {authRouter}