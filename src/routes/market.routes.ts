import express from "express"
import { resolve } from "../controllers/market.controller"
import { authMiddleware } from "../middlewares/auth.middleware"

export const marketRouter = express.Router()

marketRouter.post('/:marketId/resolve', authMiddleware, resolve)