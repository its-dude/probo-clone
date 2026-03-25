import { Request, Response } from "express";
import { marketServices } from "../services/index.services";

export const resolve = async (req: Request, res: Response) => {
    try {
        const { marketId } = req.params
        let { side } = req.body

        if (!side || (side !== "yes" && side !== "no")) return res.status(400).json({ success: false, message: "Winning side not provided" })
        side = side =="yes"?"YES": "NO"
    
        await marketServices.resolve(req.userId!, Number(marketId), side)
        
        return res.status(200).json({success: true, message: "Market resolved and cash settled successfully"})

    } catch (err: unknown) {
        if (err instanceof Error) {
            return res.status(400).json({ success: false, message: err.message })
        }

        return res.status(500).json({
            success: false,
            message: "Something went wrong"
        });
    }
}