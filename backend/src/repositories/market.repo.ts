import { prisma } from "../config/prisma"

export const getMarketById = (marketId: number) => {
    return prisma.market.findUnique({
        where: {
            id: marketId
        },
    })
}

export const updateResolution = (marketId: number, side: "YES"| "NO") => {
    return prisma.market.update({
        where: {
            id: marketId
        },
        data: {
            resolution: side
        }
    })
}


