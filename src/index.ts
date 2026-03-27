import express from "express"
import http from "http"
import { authRouter } from "./routes/auth.routes"
import { walletRouter } from "./routes/wallet.routes"

import {config} from "./config/config"
import { Orderbook } from "./types/orderbook"
import { orderRouter } from "./routes/order.routes"
import { marketRouter } from "./routes/market.routes"
import { initOrderbookSubscriber } from "./events/orderbook.subscriber"
import { initWebsocketServer } from "./websockets/server"

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
app.get("/health", (req,res)=>res.json("Server is up."))

server.listen(config.port,()=>console.log(`server is running on port ${config.port}`))