import express from "express"
import { authMiddleware } from "../middlewares/auth.middleware"
import { orderController } from "../controllers/index.controller"

export const orderRouter = express.Router()

orderRouter.post('/buy', authMiddleware, orderController.buyOrder)
orderRouter.post('/sell', authMiddleware, orderController.sellOrder)