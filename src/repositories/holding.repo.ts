import { prisma } from "../config/prisma"
import { Prisma } from "@prisma/client"

export const createHolding = (userId: number, marketId: number, side: "YES" | "NO", qty: number) => {
    return prisma.holding.create({
        data: {
            userId,
            marketId,
            side,
            quantity: qty
        }
    })
}

export const findHolding = (userId: number, marketId: number, side: "YES" | "NO") => {
    return prisma.holding.findUnique({
        where: {
            userId_marketId_side: {
                userId,
                marketId,
                side
            }
        }
    })
}

export const moveToLockedHolding = (userId: number, marketId: number, side: "YES" | "NO", qty: number) => {
    return prisma.holding.update({
        where: {
            userId_marketId_side: {
                userId,
                marketId,
                side
            }
        },
        data: {
            quantity: { decrement: qty }, 
            locked: { increment: qty }   
        }
    })
}

export const unlockHolding = (userId: number, marketId: number, side: "YES" | "NO", qty: number) => {
    return prisma.holding.update({
        where: {
            userId_marketId_side: {
                userId,
                marketId,
                side
            }
        },
        data: {
            locked: { decrement: qty }
        }
    })
}

export const lockHolding = (userId: number, marketId: number, side: "YES" | "NO", qty: number) => {
    return prisma.holding.update({
        where: {
            userId_marketId_side: {
                userId,
                marketId,
                side
            }
        },
        data: {
            locked: { increment: qty }
        }
    })
}

export const creditHolding = (userId: number, marketId: number, side: "YES" | "NO", qty: number) => {
    return prisma.holding.update({
        where: {
            userId_marketId_side: {
                userId,
                marketId,
                side
            }
        },
        data: {
            quantity: { increment: qty }
        }
    })
}

export const getHoldingsByMarketAndSideTx = (tx: Prisma.TransactionClient , marketId: number, side: "YES"|"NO") => {
    return tx.holding.findMany({
        where: {
            marketId,
            side,
        },
        select: {
            userId: true,
            quantity: true,
            locked: true
        }
    })
}

export const deleteManyByMarketIdTx = (tx: Prisma.TransactionClient, marketId: number) => {
    return tx.holding.deleteMany({
        where: {
            marketId
        }
    })
}

export const getHoldingsByUserAndMarketId = (userId: number, marketId: number) => {
    return prisma.holding.findMany({
        where: {
            userId,
            marketId
        },
        select:{
            side: true,
            quantity: true,
            locked: true
        }
    })
}