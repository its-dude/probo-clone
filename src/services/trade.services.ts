import { Prisma } from "@prisma/client"
import { prisma } from "../config/prisma"

export const exchangeWithBuyer = async (seller: { id: number, side: "YES" | "NO", price: number }, buyer: { id: number, side: "YES" | "NO", price: number }, marketId: number, quantity: number) => {

    return await prisma.$transaction(async (tx) => {

        await tx.$queryRaw`
                SELECT id FROM "Wallet"
                WHERE "userId" IN (${buyer.id}, ${seller.id})
                FOR UPDATE
            `;

        await tx.$queryRaw`
                SELECT id FROM "Holding"
                WHERE "userId" IN (${buyer.id}, ${seller.id})
                AND "marketId" = ${marketId}
                FOR UPDATE
            `;

        const sellerTotalPrice = seller.price * quantity
        const buyerTotalPrice = buyer.price * quantity

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
                locked: { decrement: buyerTotalPrice }
            }
        })

        await tx.wallet.update({
            where: {
                userId: seller.id
            },
            data: {
                balance: { increment: sellerTotalPrice }
            }
        })

        if (buyerHolding) {
            await tx.holding.update({
                where: {
                    userId_marketId_side: {
                        userId: buyer.id,
                        marketId,
                        side: buyer.side
                    }
                },
                data: {
                    quantity: { increment: quantity }
                }
            })
        } else {
            await tx.holding.create({
                data: {
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
                quantity: { decrement: quantity }
            }
        })

    }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead, })
}

export const exchangeBetweenSeller = async (sellerA: { id: number, side: "YES" | "NO", price: number }, sellerB: { id: number, side: "YES" | "NO", price: number }, marketId: number, quantity: number) => {
    return await prisma.$transaction(async (tx) => {

        await tx.$queryRaw`
                SELECT id FROM "Wallet"
                WHERE "userId" IN (${sellerA.id}, ${sellerB.id})
                FOR UPDATE
            `;

        await tx.$queryRaw`
                SELECT id FROM "Holding"
                WHERE "userId" IN (${sellerA.id}, ${sellerB.id})
                AND "marketId" = ${marketId}
                FOR UPDATE
            `;

        const totalPriceA = quantity * sellerA.price
        const totalPriceB = quantity * sellerB.price

        await tx.wallet.update({
            where: {
                userId: sellerB.id
            },
            data: {
                balance: { increment: totalPriceB }
            }
        })

        await tx.wallet.update({
            where: {
                userId: sellerA.id
            },
            data: {
                balance: { increment: totalPriceA }
            }
        })

        await tx.holding.update({
            where: {
                userId_marketId_side: {
                    userId: sellerB.id,
                    marketId,
                    side: sellerB.side
                }
            },
            data: {
                locked: { decrement: quantity }
            }
        })

        await tx.holding.update({
            where: {
                userId_marketId_side: {
                    userId: sellerA.id,
                    side: sellerA.side,
                    marketId
                }
            },
            data: {
                locked: { decrement: quantity }
            }
        })

    }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead, })
}

export const BuyFromSeller = async (buyer: { id: number, side: "YES" | "NO", price: number }, seller: { id: number, side: "YES" | "NO", price: number }, marketId: number, quantity: number) => {

    return prisma.$transaction(async (tx) => {

        await tx.$queryRaw`
                SELECT id FROM "Wallet"
                WHERE "userId" IN (${buyer.id}, ${seller.id})
                FOR UPDATE
            `;

        await tx.$queryRaw`
                SELECT id FROM "Holding"
                WHERE "userId" IN (${buyer.id}, ${seller.id})
                AND "marketId" = ${marketId}
                FOR UPDATE
            `;

        //update balance
        await tx.wallet.update({
            where: {
                userId: buyer.id
            },
            data: {
                locked: { decrement: quantity * buyer.price }
            }
        })

        await tx.wallet.update({
            where: {
                userId: seller.id
            },
            data: {
                balance: { increment: quantity * seller.price }
            }
        })
        // update holdings
        const buyerHolding = await tx.holding.findUnique({
            where: {
                userId_marketId_side: {
                    userId: buyer.id,
                    side: buyer.side,
                    marketId
                }
            }
        })

        if (!buyerHolding) {
            await tx.holding.create({
                data: {
                    userId: buyer.id,
                    marketId,
                    side: buyer.side,
                    quantity
                }
            })
        } else {
            await tx.holding.update({
                where: {
                    userId_marketId_side: {
                        userId: buyer.id,
                        marketId,
                        side: buyer.side,
                    }
                },
                data: {
                    quantity: { increment: quantity }
                }
            })
        }

        await tx.holding.update({
            where: {
                userId_marketId_side: {
                    userId: seller.id,
                    marketId,
                    side: seller.side,
                }
            },
            data: {
                quantity: { decrement: quantity }
            }
        })

    }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead, })

}

export const BuyFromBuyer = async (buyerA: { id: number, side: "YES" | "NO", price: number }, buyerB: { id: number, side: "YES" | "NO", price: number }, marketId: number, quantity: number) => {

    return prisma.$transaction(async (tx) => {

        await tx.$queryRaw`
                SELECT id FROM "Wallet"
                WHERE "userId" IN (${buyerA.id}, ${buyerB.id})
                FOR UPDATE
            `;

        await tx.$queryRaw`
                SELECT id FROM "Holding"
                WHERE "userId" IN (${buyerA.id}, ${buyerB.id})
                AND "marketId" = ${marketId}
                FOR UPDATE
            `;

        //update wallet
        await tx.wallet.update({
            where: {
                userId: buyerA.id
            },
            data: {
                locked: { decrement: quantity * buyerA.price }
            }
        })

        await tx.wallet.update({
            where: {
                userId: buyerB.id
            },
            data: {
                locked: { decrement: quantity * buyerB.price }
            }
        })

        //update holdings
        const buyerAHolding = await tx.holding.findUnique({
            where: {
                userId_marketId_side: {
                    userId: buyerA.id,
                    side: buyerA.side,
                    marketId
                }
            }
        })

        if (!buyerAHolding) {
            await tx.holding.create({
                data: {
                    userId: buyerA.id,
                    marketId,
                    side: buyerA.side,
                    quantity
                }
            })
        } else {
            await tx.holding.update({
                where: {
                    userId_marketId_side: {
                        userId: buyerA.id,
                        marketId,
                        side: buyerA.side,
                    }
                },
                data: {
                    quantity: { increment: quantity }
                }
            })
        }

        const buyerBHolding = await tx.holding.findUnique({
            where: {
                userId_marketId_side: {
                    userId: buyerB.id,
                    side: buyerB.side,
                    marketId
                }
            }
        })

        if (!buyerBHolding) {
            await tx.holding.create({
                data: {
                    userId: buyerB.id,
                    marketId,
                    side: buyerB.side,
                    quantity
                }
            })
        } else {
            await tx.holding.update({
                where: {
                    userId_marketId_side: {
                        userId: buyerB.id,
                        marketId,
                        side: buyerB.side,
                    }
                },
                data: {
                    quantity: { increment: quantity }
                }
            })
        }


    }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead, })
}