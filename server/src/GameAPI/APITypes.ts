import { Card, isCard } from "../Uno/Card";
import { CardColors } from "../Uno/CardColors";
import { isPlayer, Player } from "../Uno/Player";

export interface GenericResponse {
    success: boolean
}

export function isGenericResponse(o: any): o is GenericResponse {
    return typeof o.success === "boolean";
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

export function isRegisterResponse(o: any): o is RegisterResponse {
    return typeof o.id === "number" && isPlayer(o);
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

export function isDiscardResponseReason(o: any): o is DiscardResposeReason {
    return typeof o === "number" && o in DiscardResposeReason;
}

export interface DiscardResponse extends GenericResponse {
    reason: DiscardResposeReason
}

export function isDiscardResponse(o: any): o is DiscardResponse {
    return isDiscardResponseReason(o.reason) && isGenericResponse(o);
}

export interface PlayerInfo {
    name: string
    hand: number
}

export function isPlayerInfo(o: any): o is PlayerInfo {
    return typeof o.name === "string" && typeof o.hand === "number";
}

export interface GameState {
    lastModified: number
    currentPlayer: number
    gameRunning: boolean
    winner: number | null
    discard: Card
    players: number[]
    playerOrder: number
}

export function isGameState(o: any): o is GameState {
    return typeof o.lastModified === "number" &&
        typeof o.currentPlayer === "number" &&
        typeof o.gameRunning === "boolean" &&
        (o.winner === null || typeof o.winner === "number") &&
        isCard(o.discard) &&
        Array.isArray(o.players) &&
        o.players.every((i: any) => typeof i === "number");
}
