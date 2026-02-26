import express from "express"
import http from "http"
import { authRouter } from "./routes/auth.routes"

import {config} from "./config/config"

const app = express()
const server = http.createServer(app)

app.use(express.json())
app.use('/api/v1/auth', authRouter)

app.get("/health", (req,res)=>res.json("Server is up."))

server.listen(config.port,()=>console.log(`server is running on port ${config.port}`))