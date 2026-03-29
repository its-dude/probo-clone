import { Request, Response } from "express"
import { walletServices } from "../services/index.services"
import { walletRepository } from "../repositories/index.repo"

export const getWalletBalance = async (req: Request, res: Response) => {
    try{
        const wallet = await walletServices.getWallet(req.userId!)
        return res.status(200).json({success: true, data:{wallet}})
    } catch (err: any) {
        return res.status(400).json({success:false, message: err.message})
    }
}

export const updateBalance = async (req: Request, res: Response) => {
    try{
        const wallet = await walletRepository.resetWallet(req.userId!)
        return res.status(200).json({success: true, message: "Wallet updated"})
    } catch(err: any) {
        return res.status(400).json({success: false, message: "err.message"})
    }
}