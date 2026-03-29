import { getHoldingsByUserAndMarketId } from "../repositories/holding.repo"

export const getHoldings = (userId: number, marketId: number) => {
    return getHoldingsByUserAndMarketId(userId, marketId)
}