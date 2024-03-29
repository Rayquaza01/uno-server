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

    /**
     * Gets an overview of the current state of the game
     */
    getGameState(): GameState {
        return {
            lastModified: this.lastUpdated.getTime(),
            currentPlayer: this.currentPlayer,
            gameRunning: this.gameRunning,
            winner: this.winner,
            discard: this.unoDeck.getTop(),
            players: this.players.map(i => i.hand.length),
            playerOrder: this.playerOrder
        };
    }

    /**
     * Gets an overview of players, with their names and hand lengths
     */
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

            this.lastUpdated = new Date();

            return this.players.length - 1;
        }

        return -1;
    }

    /**
     * Get a player at a given id
     * @param id The id of the player to get
     * @returns The player object if it was found, undefined otherwise
     */
    getPlayer(id: number): Player | undefined {
        return this.players[id];
    }

    /**
     * Starts the game
     * Deals 5 cards to each player's hand and initializes the discard pile
     */
    startGame(): void {
        if (this.gameRunning) return;

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
    discard(p: number, c: number | null, wild?: CardColors): boolean {
        // if the player trying to discard is not the current player
        // OR if the game is not running
        // fail to discard
        if (p !== this.currentPlayer || !this.gameRunning) {
            return false;
        }

        // if card to discard is null, player wants to draw a card
        if (c === null) {
            // can only draw a card if no card in hand can be discarded
            // check the discardability of each card
            if (this.players[p].hand.every(item => !this.unoDeck.discard(item, false))) {
                // draw a new card and move to the next player
                this.draw(p, 1);
                this.currentPlayer = this.nextPlayer();

                this.lastUpdated = new Date();

                return true;
            }
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
        if (wild !== undefined && card.color === CardColors.WILD) {
            this.unoDeck.updateTop(wild, card.number);
        }

        // do special actions
        switch (card.number) {
            case CardNumbers.ADD_2:
                this.draw(this.nextPlayer(), 2);
                this.currentPlayer = this.nextPlayer();
                break;
            case CardNumbers.ADD_4:
                this.draw(this.nextPlayer(), 4);
                this.currentPlayer = this.nextPlayer();
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


        // Check all players
        // If there is a player with no cards, declare them the winner
        if (this.players.find(i => i.hand.length === 0)) {
            this.gameRunning = false;
            this.winner = p;
        }

        this.lastUpdated = new Date();

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

        // sort hand so that cards appear in order client-side
        // sort by colors first, falling back to numbers if the colors are the same
        this.players[p].hand.sort((a, b) => {
            // color sorting
            if (a.color < b.color) {
                return -1;
            } else if (a.color > b.color) {
                return 1;
            }

            // colors must be equal

            // number sorting
            if (a.number < b.number) {
                return -1;
            } else if (a.number > b.number) {
                return 1;
            }

            // color and number must be equal
            return 0;
        });

        this.lastUpdated = new Date();
    }
}
