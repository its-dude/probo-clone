import { walletRepository } from "../repositories/index.repo"

export const getWallet = (userId: number) => {
    return walletRepository.getUserWalletById(userId)
}