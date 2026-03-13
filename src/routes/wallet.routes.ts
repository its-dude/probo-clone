import express from "express"
import { authMiddleware } from "../middlewares/auth.middleware"
import { getWalletBalance } from "../controllers/wallet.controller"

export const walletRouter = express.Router()

walletRouter.get('/balance', authMiddleware, getWalletBalance)