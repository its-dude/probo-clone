import { prisma } from "../config/prisma"

export const createUser = (data: any)=>{
    return prisma.user.create({data})
}

export const findUserByEmail = (email: string) => {
    return prisma.user.findUnique({
        where:{
            email
        }
    })
}

export const findUserById = (id: number) => {
    return prisma.user.findUnique({
        where:{
            id
        }
    })
}