import { Card } from "../Uno/Card";
import { CardColors } from "../Uno/CardColors";
import { Player } from "../Uno/Player";

export interface GenericResponse {
    success: boolean
}

export interface RegisterBody {
    name: string
}

export function isRegisterBody(o: any): o is RegisterBody {
    // if o.name is a string AND
    // o.id is undefined OR o.id is a string
    return typeof o.name === "string";
}

export interface RegisterResponse extends Player {
    id: number
}

export interface DiscardBody {
    id: number
    card: number
    wild?: CardColors
}

export function isDiscardBody(o: any): o is DiscardBody {
    // if o.id is a string AND
    // if o.card is a number AND
    // if o.wild is undefined OR o.wild is a card number
    return typeof o.id === "string" && typeof o.card === "number" && (typeof o.wild === "undefined" || typeof CardColors[o.wild] === "string");
}

export enum DiscardResposeReason {
    OK,
    PLAYER_NOT_FOUND,
    INVALID_DISCARD
}

export interface DiscardResponse extends GenericResponse {
    reason: DiscardResposeReason
}

export interface PlayerInfo {
    name: string
    hand: number
}

export interface GameState {
    lastModified: number
    currentPlayer: number
    gameRunning: boolean
    winner: number | null
    discard: Card
    players: number[]
}
