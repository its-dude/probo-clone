import { ORDERBOOK } from ".."
import { holdingRepository, marketRepository, walletRepository } from "../repositories/index.repo"
import { OrderEntry } from "../types/orderbook"
import { orderMapToObject } from "../utils/mapToObject"
import { exchangeBetweenSeller, exchangeWithBuyer } from "./trade.services"

type Order = {
    price: number,
    quantity: number,
    side: "YES" | "NO",
    marketId: number,
    userId: number
}

const validateBuyOrder = async (order: Order) => {
    const { price, quantity, marketId, userId } = order;

    const wallet = await walletRepository.getUserWalletById(userId);
    if (!wallet) throw new Error("Wallet not found");

    const availableBalance = wallet.balance - wallet.locked;
    if (availableBalance < price * quantity) {
        throw new Error("Insufficient balance");
    }

    if (price < 10 || price >= 1000 ) throw new Error("Invalid price");

    const market = await marketRepository.getMarketById(marketId);
    if (!market) throw new Error("Market not found");

    return true;
};

const validateSellOrder = async (order: Order) => {
    const {price, marketId, userId, side, quantity} = order

    if (price < 10 || price >= 1000 ) throw new Error("Invalid price")

    const holding = await holdingRepository.findHolding(userId, marketId, side)

    if (!holding) throw new Error("Not enough stocks")
    
    if (holding.quantity < quantity) throw new Error("Not enough stocks")
    
    return true
}

export const buyOrder = async (order: Order) => {

    await validateBuyOrder(order)
    
    if (order.side == "YES") {
        return buyYesOrder(order)
    } else if (order.side == "NO") {
        return buyNoOrder(order)
    }
}

export const sellOrder = async (order: Order) =>  {
    await validateSellOrder(order)

    if (order.side === "YES") {
        return sellYesOrder(order)
    }else {
        return sellYesOrder(order)
    }
}

const buyYesOrder = async ({
    price,
    quantity,
    side,
    marketId,
    userId
}: Order) => {
    const wallet = await walletRepository.getUserWalletById(userId)
    await walletRepository.updateWalletByUserId(userId, {
        balance: wallet!.balance - price * quantity,
        locked: wallet!.locked + price * quantity
    })
    
    let availableQuantity = 0
    let availableNoQuantity = 0

    let market = ORDERBOOK.get(marketId)
    const yesPriceLevel = market?.yes?.get(price)
    const noPriceLevel = market?.no?.get(1000 - price)
    const revertedNoPriceLevel = market?.no?.get(price)

    if (yesPriceLevel) availableQuantity += yesPriceLevel.total
    if (noPriceLevel) availableNoQuantity += noPriceLevel.total
    if (revertedNoPriceLevel) availableNoQuantity += revertedNoPriceLevel.total

    let quantityNeeded = quantity

    if (yesPriceLevel && availableQuantity > 0) {
        for (let [sellerId, order] of yesPriceLevel.orders) {
            const toTake = Math.min(order.quantity, quantityNeeded)

            yesPriceLevel.total -= toTake
            order.quantity -= toTake
            quantityNeeded -= toTake

            if (order.type == "sell") {
                //decreaseHoldingsLock
                await holdingRepository.unlockHolding(sellerId, marketId, side, toTake)
                //updateBalance
                await walletRepository.creditBalanceByUserId(sellerId, toTake * price)

            } else { //type == reverted
                //increaseNoHoldingOfSeller
                const userHolding = await holdingRepository.findHolding(sellerId, marketId, "NO")
                if (userHolding) {
                    await holdingRepository.creditHolding(sellerId, marketId, "NO", toTake)
                } else {
                    await holdingRepository.createHolding(sellerId, marketId, "NO", toTake)
                }
                //decreaseLockedMoney
                await walletRepository.deductLockedFunds(sellerId, (1000 -price) * quantity)
            }
            
            if (order.quantity === 0) {
                yesPriceLevel.orders.delete(sellerId)
            }
            if (quantityNeeded <= 0) break
        }
        if (yesPriceLevel.total === 0) {
            market?.yes.delete(price)
        }
    }

    if (quantityNeeded > 0 && availableNoQuantity > 0 && noPriceLevel) {
        for (let [sellerId, order] of noPriceLevel.orders) {
            if (order.type === "reverted") continue
            
            const toTake = Math.min(order.quantity, quantityNeeded)

            noPriceLevel.total -= toTake
            order.quantity -= toTake
            quantityNeeded -= toTake

            if (order.type == "sell") {
                //decrease locked holdings
                await holdingRepository.unlockHolding(sellerId, marketId, "NO", toTake)
                //increase wallet balance
                await walletRepository.creditBalanceByUserId(sellerId, toTake * (1000 - price))
            }

            if (order.quantity === 0) {
                noPriceLevel.orders.delete(sellerId)
            }

            if (quantityNeeded <= 0) break
        }
        
        if (noPriceLevel.total === 0) {
            market?.no.delete(1000-price)
        }
    }

    if (quantityNeeded > 0 && availableNoQuantity > 0 && revertedNoPriceLevel) {
        for (let [sellerId, order] of revertedNoPriceLevel.orders) {
            const toTake = Math.min(order.quantity, quantityNeeded)

            revertedNoPriceLevel.total -= toTake
            order.quantity -= toTake
            quantityNeeded -= toTake

            if (order.type == "reverted") {
                const userHolding = await holdingRepository.findHolding(sellerId, marketId, side)
                //increase holdings
                if (userHolding) {
                    await holdingRepository.creditHolding(sellerId, marketId, side, toTake)
                } else {
                    await holdingRepository.createHolding(sellerId, marketId, side, toTake)
                }
                //decrease locked wallet 
                await walletRepository.deductLockedFunds(sellerId, toTake * (1000 - price))
            }

            if (order.quantity === 0) revertedNoPriceLevel.orders.delete(sellerId)
            if (quantityNeeded <= 0) break
        }
        if (revertedNoPriceLevel.total === 0) market?.no.delete(price)
    }

    if (quantityNeeded > 0) {
        // //convert it to opposite side and place in orderbook
        // console.dir(ORDERBOOK,{depth: null})
        mintOppositeStock({userId, marketId, side,price, quantity:quantityNeeded})
        // console.log("minted")
        // console.dir(ORDERBOOK,{depth: null})
    }

    //update user's holding of market to quantity-quantityNeeded
    const userHolding = await holdingRepository.findHolding(userId, marketId, "YES")
    if (userHolding) {
        await holdingRepository.creditHolding(userId, marketId, "YES", quantity - quantityNeeded)
    } else {
        await holdingRepository.createHolding(userId, marketId, "YES", quantity - quantityNeeded)
    }
    //decrease user locked amount to quantity - quantityneeded
    await walletRepository.deductLockedFunds(userId, price * (quantity - quantityNeeded))

    return {
        message: `Buy order for yes added for marketId ${marketId}`,
        orderbook: (orderMapToObject(ORDERBOOK))[marketId]
    }
}

const buyNoOrder = async ({
    price,
    quantity,
    side,
    marketId,
    userId
}: Order) => {
    const wallet = await walletRepository.getUserWalletById(userId)
    await walletRepository.updateWalletByUserId(userId, {
        balance: wallet!.balance - price * quantity,
        locked: wallet!.locked + price * quantity
    })

    let availableQuantity = 0
    let availableYesQuantity = 0

    let market = ORDERBOOK.get(marketId)
    const noPriceLevel = market?.no?.get(price)
    const yesPriceLevel = market?.yes?.get(10 - price)
    const revertedYesPriceLevel = market?.yes?.get(price)

    if (noPriceLevel) availableQuantity += noPriceLevel.total
    if (yesPriceLevel) availableYesQuantity += yesPriceLevel.total
    if (revertedYesPriceLevel) availableYesQuantity += revertedYesPriceLevel.total

    let quantityNeeded = quantity

    if (noPriceLevel && availableQuantity > 0) {
        for (let [sellerId, order] of noPriceLevel.orders) {
            const toTake = Math.min(order.quantity, quantityNeeded)

            noPriceLevel.total -= toTake
            order.quantity -= toTake
            quantityNeeded -= toTake

            if (order.type == "sell") {
                //decreaseHoldingsLock
                await holdingRepository.unlockHolding(sellerId, marketId, side, toTake)
                //updateBalance
                await walletRepository.creditBalanceByUserId(sellerId, toTake * price)

            } else { //type == reverted
                //increaseYesHoldingOfSeller
                const holding = await holdingRepository.findHolding(sellerId, marketId, "YES")
                if (holding) {
                    await holdingRepository.creditHolding(sellerId, marketId, "YES", toTake)
                }else {
                    await holdingRepository.createHolding(sellerId, marketId, "YES", toTake)
                }
                //decreaseLockedMoney
                await walletRepository.deductLockedFunds(sellerId, toTake * (1000 - price))

            }
             
            if (order.quantity === 0) noPriceLevel.orders.delete(sellerId)
            if (quantityNeeded <= 0) break
        }
        if (noPriceLevel.total === 0) market?.no.delete(price)
    }

    if (quantityNeeded > 0 && availableYesQuantity > 0 && yesPriceLevel) {
        for (let [sellerId, order] of yesPriceLevel.orders) {
            if (order.type === "reverted") continue
            
            const toTake = Math.min(order.quantity, quantityNeeded)

            yesPriceLevel.total -= toTake
            order.quantity -= toTake
            quantityNeeded -= toTake

            if (order.type == "sell") {
                //decrease locked holdings
                await holdingRepository.unlockHolding(sellerId, marketId, "YES", toTake)
                //increase wallet balance
                await walletRepository.creditBalanceByUserId(sellerId, toTake * price)
            }

            if (order.quantity === 0) yesPriceLevel.orders.delete(sellerId)
            if (quantityNeeded <= 0) break
        }
        if (yesPriceLevel.total === 0) market?.yes.delete(1000-price)
    }

    if (quantityNeeded > 0 && availableYesQuantity > 0 && revertedYesPriceLevel) {
        for (let [sellerId, order] of revertedYesPriceLevel.orders) {
            const toTake = Math.min(order.quantity, quantityNeeded)

            revertedYesPriceLevel.total -= toTake
            order.quantity -= toTake
            quantityNeeded -= toTake

            if (order.type == "reverted") {
                //increase holdings
                const holding  = await holdingRepository.findHolding(sellerId, marketId, side)
                if (holding) {
                    await holdingRepository.creditHolding(sellerId, marketId, side, toTake)
                }else {
                    await holdingRepository.createHolding(sellerId, marketId, side, toTake)
                }
                //decrease locked wallet 
                await walletRepository.deductLockedFunds(sellerId, (1000 - price) * toTake)
            }

            if (order.quantity === 0) revertedYesPriceLevel.orders.delete(sellerId)
            if (quantityNeeded <= 0) break
        }
        if (revertedYesPriceLevel.total === 0) market?.yes.delete(price)
    }

    if (quantityNeeded > 0) {
        //convert it to opposite side and place in orderbook
        mintOppositeStock({userId, marketId, side, price, quantity:quantityNeeded})
    }

    //update user's holding of market to quantity-quantityNeeded
    const userHolding = await holdingRepository.findHolding(userId, marketId, "NO")
    if (userHolding) {
        await holdingRepository.creditHolding(userId, marketId, "NO", quantity - quantityNeeded)
    } else {
        await holdingRepository.createHolding(userId, marketId, "NO", quantity - quantityNeeded)
    }
    await walletRepository.deductLockedFunds(userId, price* (quantity-quantityNeeded))

    return {
        message: `Buy order for no added for ${marketId}`,
        orderbook: orderMapToObject(ORDERBOOK)[marketId]
    }
}

export const sellYesOrder = async ({userId, marketId, price, side, quantity}: Order) => {

    // 1. match with reverted yes at 10-price
    // 2. match with sell yes at 10-price, 
    // 3. match with reverted no at price.

    await holdingRepository.moveToLockedHolding(userId,marketId,side, quantity)
    let remainingQty = quantity
    const TOTAL = 1000
    const oppositePrice = TOTAL - price
    const market = ORDERBOOK.get(marketId)!

    const noPriceLevel =  market.no.get(1000 - price)
    const yesPriceLevel = market.yes.get(price)
    
    //direct match with buy yes at price i.e reverted one
    if (noPriceLevel) {
        for (let [buyerId, order] of noPriceLevel.orders) {

            if (buyerId === userId) continue
            if (order.type !== "reverted") continue

            const matchedQuantity = Math.min(quantity, order.quantity)
            await exchangeWithBuyer({id:userId, side, price}, {id:buyerId, side, price}, marketId, matchedQuantity)
            remainingQty -= matchedQuantity
        }
    }

    //match with sell no at opposite price
    if (noPriceLevel && remainingQty > 0) {
        for (let [sellerId, order] of noPriceLevel?.orders!) {
    
            if (sellerId === userId) continue
            if (order.type !== "sell") continue
    
            const matchedQuantity = Math.min(quantity, order.quantity)
            await exchangeBetweenSeller({id:userId, side, price}, {id: sellerId, side: "NO",price: oppositePrice }, marketId, matchedQuantity)
            remainingQty -= matchedQuantity
        }
    }

    // match with reverted tes at price( with buy no at opposite price)
    if (yesPriceLevel && remainingQty > 0) {
        for (let [buyerId, order] of yesPriceLevel?.orders!) {
    
            if (buyerId === userId) continue
            if (order.type !== "reverted") continue
    
            const matchedQuantity = Math.min(quantity, order.quantity) 
            await exchangeWithBuyer({id: userId, side, price}, {id: buyerId, side:"NO", price: 1000 - price}, marketId, matchedQuantity)
            remainingQty -= matchedQuantity
        }
    }

    if (remainingQty > 0) {
        placeSellOrder({userId,marketId,price,quantity, side})
    }

     return {
        message: `Sell order for Yes added for ${marketId}`,
        orderbook: orderMapToObject(ORDERBOOK)[marketId]
    }
}

export const sellNoOrder = async ({userId, marketId, price, side, quantity}: Order) => {

    // 1. match with reverted yes at 10-price
    // 2. match with sell yes at 10-price, 
    // 3. match with reverted no at price.

    await holdingRepository.moveToLockedHolding(userId,marketId,side, quantity)
    let remainingQty = quantity
    const TOTAL = 1000
    const oppositePrice = TOTAL - price
    const market = ORDERBOOK.get(marketId)

    const yesPriceLevel =  market?.yes.get(1000 - price)
    const noPriceLevel = market?.no.get(price)
    
    //direct match with buy no at price i.e reverted one
    if (yesPriceLevel && remainingQty > 0) {
        for (let [buyerId, order] of yesPriceLevel.orders) {

            if (buyerId === userId) continue
            if (order.type !== "reverted") continue

            const matchedQuantity = Math.min(quantity, order.quantity)
            await exchangeWithBuyer({id:userId, side, price}, {id:buyerId, side:"NO", price}, marketId, matchedQuantity)
            remainingQty -= matchedQuantity
        }
    }

    //match with sell yes at opposite price
    if (yesPriceLevel && remainingQty >0) {
        for (let [sellerId, order] of yesPriceLevel?.orders!) {
    
            if (sellerId === userId) continue
            if (order.type !== "sell") continue
    
            const matchedQuantity = Math.min(quantity, order.quantity)
            await exchangeBetweenSeller({id:userId, side, price}, {id: sellerId, side,price: oppositePrice }, marketId, matchedQuantity)
            remainingQty -= matchedQuantity
        }
    }

    // match with reverted no at price( with buy yes at opposite price)
    if (noPriceLevel && remainingQty >0) {
        for (let [buyerId, order] of noPriceLevel?.orders!) {
    
            if (buyerId === userId) continue
            if (order.type !== "reverted") continue
    
            const matchedQuantity = Math.min(quantity, order.quantity) 
            await exchangeWithBuyer({id: userId, side, price}, {id: buyerId, side:"YES", price: 1000 - price}, marketId, matchedQuantity)
            remainingQty -= matchedQuantity
        }
    } 

    if (remainingQty > 0) {
        placeSellOrder({userId,marketId,price,quantity, side})
    }
    
    return {
        message: `Sell order for No added for ${marketId}`,
        orderbook: orderMapToObject(ORDERBOOK)[marketId]
    }
}

const placeSellOrder = (order: Order) => {
    if (!ORDERBOOK.get(order.marketId)){
        ORDERBOOK.set(order.marketId, {
            yes: new Map(),
            no: new Map()
        })
    }
    
    const market = ORDERBOOK.get(order.marketId)!
    const sideMap = order.side === "YES" ? market.yes : market.no

    if (!sideMap?.get(order.price)) {
        sideMap?.set(order.price,{
            total: 0,
            orders: new Map()
        })
    }

    const priceLevel = sideMap.get(order.price)!

    priceLevel.orders.set(order.userId, {
        quantity: order.quantity,
        type: "sell"
    })
    priceLevel.total += order.quantity
}

const mintOppositeStock = (order: Order) => {
  const { marketId, price, quantity, userId } = order

  if (!ORDERBOOK.has(marketId)) {
    ORDERBOOK.set(marketId, {
      yes: new Map(),
      no: new Map()
    })
  }

  const book = ORDERBOOK.get(marketId)!

  // opposite side + opposite price
  let targetSide: "yes" | "no"
  let targetPrice: number

  if (order.side === 'YES') {
    targetSide = "no"
    targetPrice = 1000 - price
  } else {
    targetSide = "yes"
    targetPrice = 1000 - price
  }

  const sideMap = book[targetSide]

  // create price level if not exists
  if (!sideMap.has(targetPrice)) {
    sideMap.set(targetPrice, {
      total: 0,
      orders: new Map()
    })
  }

  const level = sideMap.get(targetPrice)!

  if (level.orders.has(userId)) {
    level.orders.get(userId)!.quantity += quantity
  } else {
    level.orders.set(userId, {
      type: "reverted",
      quantity
    })
  }

  level.total += quantity
}
