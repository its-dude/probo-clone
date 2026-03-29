import express from "express"
import http from "http"
import { authRouter } from "./routes/auth.routes"
import { walletRouter } from "./routes/wallet.routes"

import {config} from "./config/config"
import { Orderbook } from "./types/orderbook"
import { orderRouter } from "./routes/order.routes"
import { marketRouter } from "./routes/market.routes"
import { holdingRouter } from "./routes/holding.routes"

import { initOrderbookSubscriber } from "./events/orderbook.subscriber"
import { initWebsocketServer } from "./websockets/server"
import { prisma } from "./config/prisma"

const app = express()
const server = http.createServer(app)

initWebsocketServer(server)

export const ORDERBOOK = new Map<number, Orderbook>()
initOrderbookSubscriber()

app.use(express.json())

app.use('/api/v1/auth', authRouter)
app.use('/api/v1/wallet', walletRouter)
app.use('/api/v1/order', orderRouter)
app.use('/api/v1/market', marketRouter)
app.use('/api/v1/holdings', holdingRouter)

app.get("/health", (req,res)=>res.json("Server is up."))
app.put('/api/v1/orderbook/reset',async (req, res) => {
    ORDERBOOK.clear()
    console.log("orderbook cleared")
    await prisma.holding.deleteMany({
        where:{
            marketId:4
        }
    })
    console.log("holdings cleared")
    return res.status(200).json({success: true, message: "Orderbook and holdings reset successfully"})
})

server.listen(config.port,()=>console.log(`server is running on port ${config.port}`))