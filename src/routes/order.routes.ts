import express from "express"
import { authMiddleware } from "../middlewares/auth.middleware"
import { buyOrder } from "../controllers/order.controller"

export const orderRouter = express.Router()

orderRouter.post('/buy', authMiddleware, buyOrder)