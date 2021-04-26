import { GameState, PlayerInfo } from "../GameAPI/APITypes";
import { CardColors } from "./CardColors";
import { CardNumbers } from "./CardNumbers";
import { UnoDeck } from "./Deck";
import { Player } from "./Player";

function mod(a: number, b: number): number {
    return ((a % b) + b) % b;
}

export class UnoGame {
    private unoDeck: UnoDeck;
    private players: Player[];
    private maxPlayers: number;
    private currentPlayer: number;
    private playerOrder: number;
    private gameRunning: boolean;
    private winner: number | null;
    private lastUpdated: Date;

    constructor() {
        this.gameRunning = false;

        this.unoDeck = new UnoDeck();

        this.players = [];
        this.maxPlayers = 0;

        this.currentPlayer = 0;
        this.playerOrder = 1;

        this.winner = null;

        this.lastUpdated = new Date();
    }

    getGameState(): GameState {
        return {
            lastModified: this.lastUpdated.getTime(),
            currentPlayer: this.currentPlayer,
            gameRunning: this.gameRunning,
            winner: this.winner,
            discard: this.unoDeck.getTop(),
            players: this.players.map(i => i.hand.length)
        };
    }

    getPlayerInfo(): PlayerInfo[] {
        return this.players.map(item => {
            return { name: item.name, hand: item.hand.length };
        });
    }

    /**
     * Resets the game object
     */
    resetGame(): void {
        this.gameRunning = false;

        this.unoDeck = new UnoDeck();

        this.players = [];
        this.maxPlayers = 0;

        this.currentPlayer = 0;
        this.playerOrder = 1;

        this.winner = null;

        this.lastUpdated = new Date();
    }

    /**
     * Adds a player to the game
     * @param name The name of the player
     * @param id The ID of the player
     * @returns True if player was added, false if player couldn't be added
     */
    addPlayer(name: string): number {
        if (!this.gameRunning) {
            this.players.push({name, hand: []});
            this.maxPlayers++;
            return -1;
        }

        return this.players.length - 1;

        this.lastUpdated = new Date();
    }

    getPlayer(id: number): Player | undefined {
        return this.players[id];
    }

    /**
     * Starts the game
     * Deals 5 cards to each player's hand and initializes the discard pile
     */
    startGame(): void {
        for (let i = 0; i < this.maxPlayers; i++) {
            this.draw(i, 5);
        }
        this.unoDeck.discard(this.unoDeck.draw());
        this.gameRunning = true;
        this.lastUpdated = new Date();
    }

    /**
     * Discards a card from a player's hand
     * @param p The player index to dicard the card from
     * @param c The card index to discard from the player
     * @param wild (optional) The color to make the card if the card is wild
     * @returns True if the card was discarded, false if the card couldn't be discarded
     */
    discard(p: number, c: number, wild?: CardColors): boolean {
        // if the player trying to discard is not the current player
        // OR if the game is not running
        // fail to discard
        if (p !== this.currentPlayer || !this.gameRunning) {
            return false;
        }

        const card = this.players[p].hand[c];
        // discard the card
        // return false if discarding is not possible
        if (!this.unoDeck.discard(card)) {
            return false;
        }

        // remove the card from the player's hand
        this.players[p].hand.splice(c, 1);

        // if wild is specified, set the top card to be the specified color
        if (wild !== undefined) {
            this.unoDeck.updateTop(wild, card.number);
        }

        // do special actions
        switch (card.number) {
            case CardNumbers.ADD_2:
                this.draw(this.nextPlayer(), 2);
                break;
            case CardNumbers.ADD_4:
                this.draw(this.nextPlayer(), 4);
                break;
            case CardNumbers.SKIP:
                this.currentPlayer = this.nextPlayer();
                break;
            case CardNumbers.REVERSE:
                this.playerOrder *= -1;
                break;
        }

        // advance next player
        this.currentPlayer = this.nextPlayer();

        this.lastUpdated = new Date();

        if (this.players.find(i => i.hand.length === 0)) {
            this.gameRunning = false;
            this.winner = p;
        }

        return true;
    }

    /**
     * Get the index of the next player
     */
    nextPlayer(): number {
        return mod(this.currentPlayer + this.playerOrder, this.maxPlayers);
    }

    /**
     * Have a player draw *n* cards
     * @param p The index of the player to draw cards
     * @param n The number of cards to draw
     */
    draw(p: number, n: number): void {
        for (let i = 0; i < n; i++) {
            this.players[p].hand.push(this.unoDeck.draw());
        }
        this.lastUpdated = new Date();
    }
}