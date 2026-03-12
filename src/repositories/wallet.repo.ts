import { prisma } from "../config/prisma"

export const createWallet = (data : {userId: number, balance: number}) => {
    return prisma.wallet.create({data})
}