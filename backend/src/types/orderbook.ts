export interface IndividualEntry{
    type: "sell" | "reverted",
    quantity: number
}

export interface OrderEntry {
    total: number,
    orders: Map<number, IndividualEntry>
}

export interface Orderbook {
    yes: Map<number, OrderEntry>,
    no: Map<number, OrderEntry>
}