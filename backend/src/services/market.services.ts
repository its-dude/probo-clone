import { ORDERBOOK } from ".."
import { prisma } from "../config/prisma"
import { holdingRepository, marketRepository, walletRepository } from "../repositories/index.repo"
import { Orderbook, OrderEntry } from "../types/orderbook"

export const resolve = async (userId: number, marketId: number, side: "YES" | "NO") => {

    await validateMarket(marketId)

    await marketRepository.updateResolution(marketId, side)

    await settleMarket(marketId, side)
    
}

const validateMarket = async (marketId: number) => {
    const market = await marketRepository.getMarketById(marketId)

    if (!market) {
        throw new Error("Market does not exist")
    }
    else if (market.resolution !== null) {
        throw new Error("Market already resolved")
    }

    return true
}

const PAYOUT_PER_UNIT = 1000
const settleMarket = async (
    marketId: number,
    winningSide: "YES" | "NO"
) => {

    await prisma.$transaction(async (tx) => {

        // 1.Get holdings inside transaction
        const holdings = await holdingRepository.getHoldingsByMarketAndSideTx(
            tx,
            marketId,
            winningSide
        )

        // 2. Aggregate payouts
        const userPayoutMap = new Map<number, number>()

        for (const h of holdings) {
            if (h.quantity <= 0) continue

            const payout = h.quantity * PAYOUT_PER_UNIT

            userPayoutMap.set(
                h.userId,
                (userPayoutMap.get(h.userId) || 0) + payout
            )
        }

        // 3. Update wallets 
        for (const [userId, amount] of userPayoutMap) {

            await walletRepository.updateBalanceByUserIdTx(tx, userId, amount)

        }

        // 4. Refund open orders
        const market = ORDERBOOK.get(marketId)

        if (market) {

            const processSide = async (sideBook: Map<number,OrderEntry>, type: "YES" | "NO") => {

                for (const [price, orderEntry] of sideBook) {
                    for (const [userId, order] of orderEntry.orders) {
                        if (order.type === "sell") continue

                        const refundAmount = (PAYOUT_PER_UNIT - price) * order.quantity

                        await walletRepository.refundWalletByUserIdTx(
                            tx,
                            userId,
                            refundAmount
                        )
                    }
                }
                // refund holdings, but it is going to be deleted
            }

            await processSide(market.yes, "YES")
            await processSide(market.no, "NO")
        }

        await holdingRepository.deleteManyByMarketIdTx(tx, marketId)
        ORDERBOOK.delete(marketId)
    })
}