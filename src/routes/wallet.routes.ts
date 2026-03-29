import express from "express"
import { authMiddleware } from "../middlewares/auth.middleware"
import { getWalletBalance , updateBalance} from "../controllers/wallet.controller"

export const walletRouter = express.Router()

walletRouter.get('/balance', authMiddleware, getWalletBalance)
walletRouter.patch('/balance', authMiddleware, updateBalance)