import { prisma } from "../config/prisma"

export const createWallet = (data : {userId: number, balance: number}) => {
    return prisma.wallet.create({data})
}

export const getUserWalletById = (userId: number) => {
    return prisma.wallet.findUnique({
        where: {
            userId
        },
        select:{
            balance: true,
            locked: true
        }
    })
}