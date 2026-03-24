import { prisma } from "../config/prisma"

export const exchangeWithBuyer = async (seller:{id:number,side: "YES"|"NO", price: number}, buyer:{id: number, side: "YES"|"NO", price: number}, marketId: number, quantity: number)=>{
    return await prisma.$transaction( async (tx) => {
         const sellerTotalPrice = seller.price*quantity
         const buyerTotalPrice = buyer.price *quantity

        const buyerHolding = await tx.holding.findUnique({
            where: {
                userId_marketId_side: {
                    userId: buyer.id,
                    marketId,
                    side: buyer.side
                }
            }
        })
        
         await tx.wallet.update({
            where: {
                userId: buyer.id
            },
            data: {
                locked: {decrement: buyerTotalPrice}
            }
         })

         await tx.wallet.update({
            where: {
                userId: seller.id
            },
            data: {
                balance: {increment: sellerTotalPrice}
            }
         })

        if (buyerHolding) {
            await tx.holding.update({
               where:{
                   userId_marketId_side:{
                       userId: buyer.id,
                       marketId,
                       side: buyer.side
                   }
               },
               data: {
                   quantity: {increment: quantity}
               }
            })
        }else {
            await tx.holding.create({
                data:{
                    userId: buyer.id,
                    marketId,
                    side: buyer.side,
                    quantity
                }
            })
        }

        await tx.holding.update({
            where: {
                userId_marketId_side: {
                    userId: seller.id,
                    marketId,
                    side: seller.side
                }
            },
            data: {
                quantity: { decrement: quantity}
            }
        })

    })
}

export const exchangeBetweenSeller = async (sellerA:{id:number,side: "YES"|"NO", price: number}, sellerB:{id: number, side: "YES"|"NO", price: number}, marketId: number, quantity: number) => {
    return await prisma.$transaction( async (tx) => {
        const totalPriceA = quantity*sellerA.price
        const totalPriceB = quantity*sellerB.price

        await prisma.wallet.update({
            where:{
                userId: sellerB.id
            },
            data: {
                balance: {increment: totalPriceB}
            }
        })

        await prisma.wallet.update({
            where: {
                userId: sellerA.id
            },
            data: {
                balance: {increment: totalPriceA}
            }
        })

        await prisma.holding.update({
            where: {
                userId_marketId_side: {
                    userId: sellerB.id,
                    marketId,
                    side: sellerB.side
                }
            },
            data: {
                locked: {decrement: quantity}
            }
        })

        await prisma.holding.update({
            where: {
                userId_marketId_side: {
                    userId: sellerA.id,
                    side: sellerA.side,
                    marketId
                }
            },
            data: {
                locked: {decrement: quantity}
            }
        })

    })
}