import { prisma } from "../config/prisma"

export const getMarketById = (marketId: number) => {
    return prisma.market.findUnique({
        where: {
            id: marketId
        },
    })
}

