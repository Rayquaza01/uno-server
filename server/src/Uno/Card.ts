import { CardColors, isCardColors } from "./CardColors";
import { CardNumbers, isCardNumbers } from "./CardNumbers";

export interface Card {
    color: CardColors;
    number: CardNumbers;
}

export function isCard(o: any): o is Card {
    return isCardColors(o.color) && isCardNumbers(o.number);
}
