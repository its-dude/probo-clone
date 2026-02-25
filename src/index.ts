import express from "express"
import http from "http"

const app = express()

const server = http.createServer(app)

app.get("/", (req,res)=>res.json("hello"));

server.listen(3000,()=>console.log("server is running on port 3000"))