import { prisma } from "../config/prisma"

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
        where:{
            userId_marketId_side: {
                userId,
                marketId,
                side
            }
        },
        data: {
            quantity: {increment: qty}
        }
    })
}