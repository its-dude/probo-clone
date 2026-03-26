import { Orderbook } from "../types/orderbook"
import { eventBus } from "./eventBus"

export const initOrderbookSubscriber = () => {
    eventBus.on("orderbook_update", ( {marketId, data}:{marketId:number, data: Orderbook} )=>{
        console.log(marketId, " : ")
        console.dir(data, {depth: null})
    })
}