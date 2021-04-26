export enum CardColors {
    RED,
    YELLOW,
    GREEN,
    BLUE,
    WILD
}

export function isCardColors(o: any): o is CardColors {
    return typeof o === "number" && o in CardColors;
}
