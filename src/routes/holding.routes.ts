import express from "express"
import {getHoldings} from "../controllers/holding.controller"
import { authMiddleware } from "../middlewares/auth.middleware"

export const holdingRouter = express.Router()

holdingRouter.get("/:marketId",authMiddleware, getHoldings)

