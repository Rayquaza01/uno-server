import { Card, isCard } from "./Card";

export interface Player {
    name: string
    hand: Card[]
}

export function isPlayer(o: any): o is Player {
    return typeof o.name === "string" && Array.isArray(o.hand) && o.hand.every((i: any) => isCard(i));
}
