import { Request, Response } from "express"
import { holdingServices } from "../services/index.services"
import { success } from "zod"

export const getHoldings = async (req: Request, res: Response) => {
  try{
    const marketId = req.params.marketId
    const holding = await holdingServices.getHoldings(req.userId!, Number(marketId))
    
    return res.status(200).json({success: true, data: holding})
  } catch( err: unknown) {
    if (err instanceof Error) {
        return res.status(400).json({success: false, message: "Holding not found"})
    }

    return res.status(500).json({success: false, message: "Something went wrong"})
  }
}