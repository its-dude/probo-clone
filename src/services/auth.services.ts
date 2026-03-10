import { email, json } from "zod"
import { userRepository } from "../repositories/index.repo"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { config } from "../config/config"

export const signup = async (data: {
    firstName: string,
    lastName: string,
    email: string,
    password: string
}
) => {
    const user = await userRepository.findUserByEmail(data.email)
    if (user) {
        throw new Error("User already exists")
    }

    const hashedPassword = await bcrypt.hash(data.password, 10)
    data.password = hashedPassword

   return userRepository.createUser(data)
}

export const signin = async (data: {
    email: string,
    password: string
}) => {
    const user = await userRepository.findUserByEmail(data.email)
    
    if (!user) {
        throw new Error("Invalid email or password")
    }

    const isPasswordMatched = await bcrypt.compare(data.password, user.password)

    if (!isPasswordMatched) {
        throw new Error("Invalid email or passoword")
    }

    const token = jwt.sign({userId: user.id}, config.jwt.secret as string)

    return {token}
}