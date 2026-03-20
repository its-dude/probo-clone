import { Request, Response } from "express"
import z, { number, success } from "zod"
import { orderServices } from "../services/index.services"

const OrderSchema = z.object({
    price: z.number().int().positive(),
    quantity: z.number().int().positive(),
    side: z.enum(["yes", "no"]),
    marketId: z.number().int().positive()
})

export const buyOrder = async (req: Request, res: Response) => {
    const requestBody = OrderSchema.safeParse(req.body)

    if (!requestBody.success) {
        const errors = requestBody.error.issues.map((err) => ({
            field: err.path[0],
            message: err.message
        }))
        return res.status(400).json({ success: false, errors })
    }

    try {
        req.body.side = requestBody.data.side == "yes"? "YES" :"NO"
        const result = await orderServices.buyOrder({
            userId: req.userId!,
            ...req.body
        })

        return res.status(200).json(result)

    } catch (err: unknown) {
        if (err instanceof Error) {
            return res.status(400).json({
                success: false,
                message: err.message
            });
        }

        return res.status(500).json({
            success: false,
            message: "Something went wrong"
        });
    }
}