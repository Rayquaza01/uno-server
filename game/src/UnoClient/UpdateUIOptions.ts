export enum PopupMode {
    NONE,
    HIDE,
    TEXT,
    TEXT_TIMER,
    WILD_BUTTONS
}

export interface UpdateUIOptions {
    playerNames: boolean
    playerHands: boolean
    hand: boolean
    discard: boolean
    popup: PopupMode
    popupText?: string
}
