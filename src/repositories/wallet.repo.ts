import { prisma } from "../config/prisma"

export const createWallet = (data: { userId: number, balance: number }) => {
    return prisma.wallet.create({ data })
}

export const getUserWalletById = (userId: number) => {
    return prisma.wallet.findUnique({
        where: {
            userId
        },
        select: {
            balance: true,
            locked: true
        }
    })
}

export const updateWalletByUserId = (userId: number, data: { balance: number, locked: number }) => {
    return prisma.wallet.update({
        where: {
            userId
        },
        data
    })
}

export const lockFunds = async (userId: number, amount: number) => {
    const result = await prisma.$executeRaw`
        UPDATE "Wallet"
        SET balance = balance - ${amount},
            locked = locked + ${amount}
        WHERE "userId" = ${userId}
        AND balance >= ${amount}
    `

    if (result === 0) {
        throw new Error("Insufficient balance or wallet not found")
    }

    return true
}

export const unlockFunds = async (userId: number, amount: number) => {
    const result = await prisma.$executeRaw`
        UPDATE "Wallet"
        SET balance = balance + ${amount},
            locked = locked - ${amount}
        WHERE "userId" = ${userId}
        AND locked >= ${amount}
    `

    if (result === 0) {
        throw new Error("Insufficient balance or wallet not found")
    }

    return true
}

export const creditBalanceByUserId = (userId: number, amount: number) => {
    return prisma.wallet.update({
        where: {
            userId
        },
        data: {
            balance: { increment: amount }
        }
    })
}

export const debitBalanceByUserId = async (userId: number, amount: number) => {
    const result = await prisma.$executeRaw`
        UPDATE "Wallet"
        SET balance = balance - ${amount}
        WHERE "userId" = ${userId}
        AND balance >= ${amount}`

    if (result == 0) {
        throw new Error("Insufficent balance or wallet not found")
    }

    return true
}

export const deductLockedFunds = async (userId: number, amount: number) => {
    const result = await prisma.$executeRaw`
        UPDATE "Wallet"
        SET locked = locked - ${amount}
        WHERE "userId" = ${userId}
        AND locked >= ${amount}
        `
    if (result === 0) {
        throw new Error("Insufficient locked funds")
    }

    return true
}