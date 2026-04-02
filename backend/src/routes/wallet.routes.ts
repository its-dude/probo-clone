import express from "express"
import { authMiddleware } from "../middlewares/auth.middleware"
import { walletController } from "../controllers/index.controller"

export const walletRouter = express.Router()

walletRouter.get('/balance', authMiddleware, walletController.getWalletBalance)