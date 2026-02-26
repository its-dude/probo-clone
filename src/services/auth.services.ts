import { email } from "zod"
import { userRepository } from "../repositories/index.repo"
import bcrypt from "bcrypt"

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