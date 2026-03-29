import ws from "ws"
import jwt from "jsonwebtoken"
import http from "node:http"
import type { Server } from "node:http"
import { parse } from "url"
import { config } from "../config/config"
import { userRepository } from "../repositories/index.repo"
import { Orderbook } from "../types/orderbook"
import { orderMapToObject } from "../utils/mapToObject"

const userSockets = new Map<number, ws.WebSocket>()           
const socketToUser = new Map<ws.WebSocket, number>()          
const marketSockets = new Map<number, Set<ws.WebSocket>>()    


const authenticateSocket = async (req: http.IncomingMessage) => {
    const { query } = parse(req.url!, true)
    const token = query.token

    if (!token) return null

    return verifyJwtToken(token as string)
}

export const initWebsocketServer = (server: Server) => {
    const wss = new ws.Server({ server })

    wss.on("connection", async (socket, req) => {
        const userId = await authenticateSocket(req)

        if (!userId) {
            socket.close(1008, "Unauthorized")
            return
        }

        // store mappings
        userSockets.set(userId, socket)
        socketToUser.set(socket, userId)

        socket.on("message", (raw) => {
            let data: any

            try {
                data = JSON.parse(raw.toString())
            } catch {
                return
            }

            // SUBSCRIBE
            if (data.type === "subscribe") {
                let sockets = marketSockets.get(data.marketId)
                console.log("user subscribed")
                if (!sockets) {
                    sockets = new Set()
                    marketSockets.set(data.marketId, sockets)
                }

                sockets.add(socket)
            }

            // UNSUBSCRIBE
            if (data.type === "unsubscribe") {
                const sockets = marketSockets.get(data.marketId)
                sockets?.delete(socket)

                if (sockets && sockets.size === 0) {
                    marketSockets.delete(data.marketId)
                }
            }
        })

        socket.on("close", () => {
            console.log("unsubscribed")
            userSockets.delete(userId)
            socketToUser.delete(socket)

            // remove from all markets
            for (const [marketId, sockets] of marketSockets) {
                sockets.delete(socket)

                if (sockets.size === 0) {
                    marketSockets.delete(marketId)
                }
            }
        })
    })
}

export const broadcastToMarket = (marketId: number, data: Orderbook) => {
    const sockets = marketSockets.get(marketId)

    if (!sockets) return

    const payload = JSON.stringify({
        type: "orderbook_update",
        data: {
            yes: orderMapToObject(data.yes),
            no: orderMapToObject(data.no)
        }
    })

    for (const socket of sockets) {
        socket.send(payload)
    }
}

const verifyJwtToken = async (token: string) => {
    const [scheme, jwtToken] = token.split(" ")

    if (!scheme || scheme.toLowerCase() !== "bearer" || !jwtToken) {
        return null
    }

    try {
        const decoded = jwt.verify(jwtToken, config.jwt.secret) as {
            userId: number
        }

        const user = await userRepository.findUserById(decoded.userId)

        if (!user) return null

        return user.id
    } catch {
        return null
    }
}