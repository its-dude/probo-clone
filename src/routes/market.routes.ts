import express from "express"
import { marketController } from "../controllers/index.controller"
import { authMiddleware } from "../middlewares/auth.middleware"

export const marketRouter = express.Router()

marketRouter.post('/:marketId/resolve', authMiddleware, marketController.resolve)