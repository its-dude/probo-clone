import axios from "axios"
import WebSocket from "ws"
import { config } from "../src/config/config"
import { Orderbook } from "./types/orderbook"

const HTTP_SERVER_URL = `http://localhost:${config.port}/api/v1`
const WS_SERVER_URL = `ws://localhost:${config.port}`

let ws1: WebSocket
let token1: string
let token2: string
let userId1: number = 5
let userId2: number = 6

type OrderbookUpdateMessage = {
    type: "orderbook_update"
    data: {
        yes: Record<number, any>
        no: Record<number, any>
    }
}

describe("Trading system tests", () => {


    beforeAll(async () => {
        let user1 = {
            firstName: "test",
            lastName: "er",
            email: "test@gmail.com",
            password: "@Test123"
        }
        let user2 = {
            firstName: "test",
            lastName: "er2",
            email: "test2@gmail.com",
            password: "@Test123"
        }

        const user1Result = await axios.post(`${HTTP_SERVER_URL}/auth/signin`, user1)
        const user2Result = await axios.post(`${HTTP_SERVER_URL}/auth/signin`, user2)

        expect(user1Result.data.success).toBe(true)
        expect(user2Result.data.success).toBe(true)

        token1 = user1Result.data.token
        token2 = user2Result.data.token
        ws1 = new WebSocket(`${WS_SERVER_URL}?token=Bearer ${token1}`)

        await new Promise((resolve, reject) => {
            ws1.on("open", resolve)
            ws1.on("error", reject)
        })

    })

    beforeEach(async () => {
        await axios.patch(`${HTTP_SERVER_URL}/wallet/balance`, {}, {
            headers: {
                Authorization: `Bearer ${token1}`
            }
        })

        await axios.patch(`${HTTP_SERVER_URL}/wallet/balance`, {}, {
            headers: {
                Authorization: `Bearer ${token2}`
            }
        })

        await axios.put(`${HTTP_SERVER_URL}/orderbook/reset`)
    })

    afterEach(() => {
        ws1.send(
            JSON.stringify({
                type: "unsubscribe",
                marketId: 4
            })
        )
    })
    
    afterAll(()=> {
        ws1.close()
    })

    const waitForWSMessage = (): Promise<OrderbookUpdateMessage> => {
        return new Promise((resolve) => {
            ws1.once("message", (data: any) => {
                const parsedData = JSON.parse(data)
                resolve(parsedData)
            });
        });
    }

    test("check user wallet", async () => {
        const respone1 = await axios.get(`${HTTP_SERVER_URL}/wallet/balance`, {
            headers: {
                Authorization: `Bearer ${token1}`
            }
        })

        const respone2 = await axios.get(`${HTTP_SERVER_URL}/wallet/balance`, {
            headers: {
                Authorization: `Bearer ${token2}`
            }
        })

        expect(respone1.data.data).toEqual({
            wallet: {
                balance: 1000000,
                locked: 0
            }
        })
        expect(respone2.data.data).toEqual({
            wallet: {
                balance: 1000000,
                locked: 0
            }
        })
    })

    test("place buy order and check wallet and ws response", async () => {

        const marketId = 4
        const price = 800
        const quantity = 2
        const side = "yes"

        ws1.send(
            JSON.stringify({
                type: "subscribe",
                marketId: 4
            })
        )

        const wsPromise = waitForWSMessage()

        const httpPromise = axios.post(
            `${HTTP_SERVER_URL}/order/buy`,
            { marketId, price, quantity, side },
            {
                headers: {
                    Authorization: `Bearer ${token1}`
                }
            }
        )

        const [message, response] = await Promise.all([
            wsPromise,
            httpPromise
        ])

        expect(message.type).toBe("orderbook_update")

        expect(message.data.yes[price]).toEqual(undefined)

        expect(message.data.no[1000 - price]).toEqual({
            total: quantity,
            orders: {
                [userId1]: {
                    type: "reverted",
                    quantity: quantity
                }
            }
        })

        const wallet = await axios.get(`${HTTP_SERVER_URL}/wallet/balance`, {
            headers: {
                Authorization: `Bearer ${token1}`
            }
        })

        expect(wallet.data.data.wallet).toEqual({
            balance: 1000000 - (price * quantity),
            locked: price * quantity
        })

        ws1.send(
            JSON.stringify({
                type: "unsubscribe",
                marketId: 4
            })
        )
    })

    test("Execute buy/sell order matching with opposite side", async () => {
        const marketId = 4
        const buyPrice = 800
        const oppositePrice = 200
        const buySide = "yes"
        const sellSide = "no"
        const quantity = 10
        ws1.send(
            JSON.stringify({
                type: "subscribe",
                marketId: 4
            })
        )

        // ===== USER 1 BUY =====
        const wsMessagePromise1 = waitForWSMessage()

        const buyOrderPromise1 = axios.post(
            `${HTTP_SERVER_URL}/order/buy`,
            { marketId, price: buyPrice, quantity, side: buySide },
            {
                headers: {
                    Authorization: `Bearer ${token1}`
                }
            }
        )

        const [wsMessage1, buyResponse1] = await Promise.all([
            wsMessagePromise1,
            buyOrderPromise1
        ])

        expect(wsMessage1.type).toBe("orderbook_update")

        expect(wsMessage1.data.yes[buyPrice]).toEqual(undefined)

        expect(wsMessage1.data.no[1000 - buyPrice]).toEqual({
            total: quantity,
            orders: {
                [userId1]: {
                    type: "reverted",
                    quantity: quantity
                }
            }
        })

        const wallet1 = await axios.get(`${HTTP_SERVER_URL}/wallet/balance`, {
            headers: {
                Authorization: `Bearer ${token1}`
            }
        })

        expect(wallet1.data.data.wallet).toEqual({
            balance: 1000000 - (buyPrice * quantity),
            locked: buyPrice * quantity
        })

        // ===== USER 2 BUY (OPPOSITE SIDE → MATCH) =====

        await axios.post(
            `${HTTP_SERVER_URL}/order/buy`,
            {
                marketId,
                price: oppositePrice,
                quantity,
                side: sellSide
            },
            {
                headers: {
                    Authorization: `Bearer ${token2}`
                }
            }
        )

        // ===== CHECK MATCH RESULT =====
        const wallet2 = await axios.get(`${HTTP_SERVER_URL}/wallet/balance`, {
            headers: {
                Authorization: `Bearer ${token2}`
            }
        })

        expect(wallet2.data.data.wallet).toEqual({
            balance: 1000000 - (oppositePrice * quantity),
            locked: 0
        })

        let user1Holdings = await axios.get(`${HTTP_SERVER_URL}/holdings/${marketId}`, {
            headers: {
                Authorization: `Bearer ${token1}`
            }
        })

        let user2Holdings = await axios.get(`${HTTP_SERVER_URL}/holdings/${marketId}`, {
            headers: {
                Authorization: `Bearer ${token2}`
            }
        })

        expect(user1Holdings.data.data[0]).toEqual({
            side: "YES",
            quantity,
            locked: 0
        })

        expect(user2Holdings.data.data[0]).toEqual({
            side: "NO",
            quantity,
            locked: 0
        })

        // ===== USER 1 SELL =====
        const wsMessagePromise2 = waitForWSMessage()

        const sellOrderPromise = axios.post(
            `${HTTP_SERVER_URL}/order/sell`,
            { marketId, price: buyPrice, quantity, side: buySide },
            {
                headers: {
                    Authorization: `Bearer ${token1}`
                }
            }
        )

        const [wsMessage2, sellResponse] = await Promise.all([
            wsMessagePromise2,
            sellOrderPromise
        ])

        expect(wsMessage2.type).toBe("orderbook_update")

        expect(wsMessage2.data.yes[buyPrice]).toEqual({
            total: quantity,
            orders: {
                [userId1]: {
                    type: "sell",
                    quantity: quantity
                }
            }
        })

        user1Holdings = await axios.get(`${HTTP_SERVER_URL}/holdings/${marketId}`, {
            headers: { Authorization: `Bearer ${token1}` }
        })

        expect(user1Holdings.data.data[0]).toEqual({
            side: "YES",
            quantity: 0,
            locked: quantity
        })


    }, 15000)

    test("Execute matching with same side ", async () => {
        const marketId = 4
        const buyPrice = 800
        const oppositePrice = 200
        const buySide = "yes"
        const quantity = 10
        ws1.send(
            JSON.stringify({
                type: "subscribe",
                marketId: 4
            })
        )

        // ===== USER 1 BUY =====
        const wsMessagePromise1 = waitForWSMessage()

        const buyOrderPromise1 = axios.post(
            `${HTTP_SERVER_URL}/order/buy`,
            { marketId, price: buyPrice, quantity, side: buySide },
            {
                headers: {
                    Authorization: `Bearer ${token1}`
                }
            }
        )

        const [wsMessage1, buyResponse1] = await Promise.all([
            wsMessagePromise1,
            buyOrderPromise1
        ])

        expect(wsMessage1.type).toBe("orderbook_update")

        expect(wsMessage1.data.yes[buyPrice]).toEqual(undefined)

        expect(wsMessage1.data.no[1000 - buyPrice]).toEqual({
            total: quantity,
            orders: {
                [userId1]: {
                    type: "reverted",
                    quantity: quantity
                }
            }
        })

        const wallet1 = await axios.get(`${HTTP_SERVER_URL}/wallet/balance`, {
            headers: {
                Authorization: `Bearer ${token1}`
            }
        })

        expect(wallet1.data.data.wallet).toEqual({
            balance: 1000000 - (buyPrice * quantity),
            locked: buyPrice * quantity
        })

        // ===== USER 2 BUY (OPPOSITE SIDE → MATCH) =====

        await axios.post(
            `${HTTP_SERVER_URL}/order/buy`,
            {
                marketId,
                price: oppositePrice,
                quantity,
                side: buySide
            },
            {
                headers: {
                    Authorization: `Bearer ${token2}`
                }
            }
        )

        // ===== CHECK MATCH RESULT =====
        const wallet2 = await axios.get(`${HTTP_SERVER_URL}/wallet/balance`, {
            headers: {
                Authorization: `Bearer ${token2}`
            }
        })

        expect(wallet2.data.data.wallet).toEqual({
            balance: 1000000 - (oppositePrice * quantity),
            locked: 0
        })

        let user1Holdings = await axios.get(`${HTTP_SERVER_URL}/holdings/${marketId}`, {
            headers: {
                Authorization: `Bearer ${token1}`
            }
        })

        let user2Holdings = await axios.get(`${HTTP_SERVER_URL}/holdings/${marketId}`, {
            headers: {
                Authorization: `Bearer ${token2}`
            }
        })

        expect(user1Holdings.data.data[0]).toEqual({
            side:"YES",
            quantity,
            locked: 0
        })

        expect(user2Holdings.data.data[0]).toEqual({
            side: "YES",
            quantity,
            locked: 0
        })

    }, 15000)

}) 