import { Orderbook } from "../types/orderbook"
import { eventBus } from "./eventBus"

export const publishOrderbookUpdate = (marketId: number, data: Orderbook) => {
    eventBus.emit("orderbook_update", {marketId, data})
}