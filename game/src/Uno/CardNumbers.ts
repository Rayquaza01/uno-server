export enum CardNumbers {
    ZERO,
    ONE,
    TWO,
    THREE,
    FOUR,
    FIVE,
    SIX,
    SEVEN,
    EIGHT,
    NINE,
    SKIP,
    REVERSE,
    ADD_2,
    ADD_4,
    WILD
}

export function isCardNumbers(o: any): o is CardNumbers {
    return typeof o === "number" && o in CardNumbers;
}
