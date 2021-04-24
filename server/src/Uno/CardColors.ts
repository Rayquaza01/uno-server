export enum CardColors {
    RED,
    YELLOW,
    GREEN,
    BLUE,
    WILD
}

export type RealColors = Exclude<CardColors, CardColors.WILD>
