import { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"
import { config } from "../config/config"
import { userRepository } from "../repositories/index.repo"

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
      try {
        const authHeader = req.headers.authorization

        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized. Token missing."
            })
        }

        const [scheme, token] = authHeader.split(" ")

        if (!scheme || scheme.toLowerCase() !== "bearer" || !token) {
            return res.status(401).json({
                success: false,
                message: "Invalid authorization format."
            })
        }

        const decoded = jwt.verify(token, config.jwt.secret) as {
            userId: number
        }

        const user = await userRepository.findUserById(decoded.userId)

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found."
            })
        }

        req.userId = user.id

        next()

    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token."
        })
    }
}