import { PopupMode, UpdateUIOptions } from "./UpdateUIOptions";
import { Uno, GameAPI } from "uno-server-game";

const DISCARD_CARD = document.querySelector("#discardCard") as HTMLImageElement;
const HAND_CONTAINER = document.querySelector("#hand") as HTMLDivElement;

const POPUP = document.querySelector("#popup") as HTMLDivElement;
const POPUP_TEXT = document.querySelector(".popupText") as HTMLSpanElement;
const WILD_BUTTONS = document.querySelector(".wildButtons") as HTMLDivElement;

const PLAYER_CONTAINER = document.querySelector("#players") as HTMLDivElement;

const API_ENDPOINT = location.protocol + "//" + location.host + "/game";

function mod(a: number, b: number): number {
    return ((a % b) + b) % b;
}

/**
 * Gets the image URL of a card
 * @param card The card to lookup
 */
function getImageName(card: Uno.Card.Card): string {
    return "/images/uno_" + Uno.CardColors.CardColors[card.color] + "_" + Uno.CardNumbers.CardNumbers[card.number] + ".svg";
}

export class UnoClient {
    /** Name that was registered */
    private name: string;
    /** ID given by the server */
    private id: number;
    /** The player's hand of cards */
    private hand: Uno.Card.Card[];
    /** The names and hand lengths of all players */
    private players: GameAPI.PlayerInfo[];
    /** Most recently fetched game state */
    private gameState: GameAPI.GameState;

    /** Default game state, for easily resetting this object */
    private readonly defaultGameState: GameAPI.GameState = {
        lastModified: 0,
        currentPlayer: -1,
        gameRunning: false,
        discard: { color: -1, number: -1 },
        winner: null,
        players: [],
        playerOrder: 1
    };

    constructor() {
        this.name = "";
        this.id = -1;
        this.hand = [];
        this.gameState = this.defaultGameState;
        this.players = [];
    }

    /**
     * Resets the object to the default state
     */
    reset(): void {
        this.name = "";
        this.id = -1;
        this.hand = [];
        this.gameState = this.defaultGameState;
        this.players = [];
    }

    /** Gets the next player in order */
    nextPlayer(): number {
        return mod(this.gameState.currentPlayer + this.gameState.playerOrder, this.players.length);
    }

    /**
     * Sends request to start game on server
     */
    startGame(): void {
        fetch(API_ENDPOINT + "/start", { method: "POST" });
    }

    /** Sends request to reset game on server */
    resetGame(): void {
        fetch(API_ENDPOINT + "/reset", { method: "POST" });
    }

    /**
     * Sends request to register with the server
     * @param name The display name you want to set on the server
     */
    async register(name: string): Promise<void> {
        const reqBody: GameAPI.RegisterBody = { name };
        const req = await fetch(API_ENDPOINT + "/register", {
            method: "POST",
            body: JSON.stringify(reqBody)
        });
        if (req.status !== 200) return;
        const res = await req.json();

        if (!GameAPI.isRegisterResponse(res)) return;

        this.name = name;
        this.id = res.id;
        this.hand = res.hand;
    }

    /**
     * Sends a request for the newest game state
     */
    async update(): Promise<void> {
        const req = await fetch(API_ENDPOINT + "/status");
        if (req.status !== 200) return;
        const res = await req.json();
        if (!GameAPI.isGameState(res)) return;

        // if gamesate has been modified since the last request
        if (res.lastModified > this.gameState.lastModified) {
            // update game state
            this.gameState = res;

            // update player hands
            await this.updatePlayerInfo();
            this.updateUI({ playerNames: true, playerHands: true });

            // if game has ended, send a game over message
            if (!this.gameState.gameRunning && this.gameState.winner !== null) {
                this.updateUI({
                    popup: PopupMode.TEXT,
                    popupText: "Game Over\n" + this.players[this.gameState.winner].name + " Wins!"
                });
            } else if (this.gameState.gameRunning) {
                // popup with the next player name
                this.updateUI({
                    popup: PopupMode.TEXT_TIMER,
                    popupText: this.players[this.gameState.currentPlayer].name + "'s Turn"
                });
            }

            // update the discard pile
            this.updateUI({ discard: true });
            // update the player's hand
            await this.updateHand();
            this.updateUI({ hand: true });
        }
    }

    /**
     * Sends a request to get the player's current hand
     */
    async updateHand(): Promise<void> {
        const req = await fetch(API_ENDPOINT + "/players?id=" + this.id.toString());
        if (req.status !== 200) return;
        const res = await req.json();
        if (!Uno.Player.isPlayer(res)) return;

        this.hand = res.hand;
    }

    /**
     * Sends a request to get an overview of all players
     */
    async updatePlayerInfo(): Promise<void> {
        const req = await fetch(API_ENDPOINT + "/players");
        if (req.status !== 200) return;
        const res = await req.json();
        if (!(Array.isArray(res) && res.every((i: any) => GameAPI.isPlayerInfo(i)))) return;

        this.players = res;
    }

    /**
     * Discards a card from the player's hand
     * @param c Number of card to discard, or null if you want to draw a card instead
     * @param wild Color to make wild card
     */
    async discard(c: number | null, wild?: Uno.CardColors.CardColors): Promise<GameAPI.DiscardResposeReason> {
        const card: GameAPI.DiscardBody = {
            id: this.id,
            card: c,
        };

        if (Uno.CardColors.isCardColors(wild)) card.wild = wild;

        const req = await fetch(API_ENDPOINT + "/discard", {
            method: "POST",
            body: JSON.stringify(card)
        });
        if (req.status !== 200) return GameAPI.DiscardResposeReason.INVALID_DISCARD;
        const res = await req.json();
        if (!GameAPI.isDiscardResponse(res)) return GameAPI.DiscardResposeReason.INVALID_DISCARD;

        return res.reason;
    }

    updateUI(opts: Partial<UpdateUIOptions>): void {
        // if updating discard
        if (opts.discard) {
            // set discard soruce image
            DISCARD_CARD.src = getImageName(this.gameState.discard);
        }

        if (opts.hand) {
            // list of HTMLElement cards in hand
            const cards = [...HAND_CONTAINER.children] as HTMLImageElement[];

            let i: number;
            // loop through each card in the hand
            for (i = 0; i < this.hand.length; i++) {
                // if less than the length of the card elements
                // and colors do not match
                // replace current card on page with card in hand
                if (i < cards.length && (this.hand[i].color !== Number(cards[i].dataset.color) || this.hand[i].number !== Number(cards[i].dataset.number))) {
                    cards[i].src = getImageName(this.hand[i]);

                    cards[i].dataset.color = this.hand[i].color.toString();
                    cards[i].dataset.number = this.hand[i].number.toString();
                    cards[i].dataset.index = i.toString();

                    cards[i].classList.remove("active");
                }
                // if hand is longer than card element list
                // create new image and append it
                else if (i >= cards.length) {
                    const newImg = document.createElement("img");
                    newImg.src = getImageName(this.hand[i]);
                    newImg.classList.add("card");

                    newImg.dataset.color = this.hand[i].color.toString();
                    newImg.dataset.number = this.hand[i].number.toString();
                    newImg.dataset.index = i.toString();

                    HAND_CONTAINER.appendChild(newImg);
                }
            }

            // if card element list is longer than hand,
            // continue from where the counter left off and remove excess cards
            for (i; i < cards.length; i++) {
                HAND_CONTAINER.removeChild(cards[i]);
            }
        }

        if (opts.popup) {
            // if popup contains text
            if ((opts.popup === PopupMode.TEXT || opts.popup === PopupMode.TEXT_TIMER) && typeof opts.popupText === "string") {
                // set popup to have text
                POPUP_TEXT.innerText = opts.popupText;

                // hide wild buttons, show text
                WILD_BUTTONS.style.display = "none";
                POPUP_TEXT.style.display = "inherit";

                // make popup visible
                POPUP.style.width = "100%";

                // if popup is set to be text on a timer, auto hide the popup after 2 seconds
                if (opts.popup === PopupMode.TEXT_TIMER) {
                    setTimeout(() => {
                        POPUP.style.width = "0";
                    }, 2000);
                }
            }
            // if popup contains wild buttons
            else if (opts.popup === PopupMode.WILD_BUTTONS) {
                WILD_BUTTONS.style.display = "inherit";
                POPUP_TEXT.style.display = "none";

                POPUP.style.width = "100%";
            }
            // if popup should be hidden
            else if (opts.popup === PopupMode.HIDE) {
                POPUP.style.width = "0";
            }
        }

        // Update player name display
        if (opts.playerNames) {
            const names = [...document.querySelectorAll(".playerName")] as HTMLSpanElement[];
            // same general process as with cards above,
            // update the names if they don't match, create new names if needed, remove old names if too many
            let i: number;
            for (i = 0; i < this.players.length; i++) {
                if (i < names.length && this.players[i].name !== names[i].innerText) {
                    names[i].innerText = this.players[i].name;
                } else if (i >= names.length) {
                    const newPlayer = document.createElement("div");
                    newPlayer.classList.add("playerRow");
                    const pName = document.createElement("span");
                    pName.innerText = this.players[i].name;
                    pName.classList.add("playerName");
                    const pHand = document.createElement("span");
                    pHand.innerText = "0";
                    pHand.classList.add("playerHand");

                    newPlayer.appendChild(pName);
                    newPlayer.appendChild(pHand);

                    PLAYER_CONTAINER.appendChild(newPlayer);
                }
            }

            for (i; i < names.length; i++) {
                PLAYER_CONTAINER.removeChild(names[i].parentElement ?? document.createElement("div"));
            }
        }

        // Update player hand display
        if (opts.playerHands) {
            const hands = [...document.querySelectorAll(".playerHand")] as HTMLSpanElement[];

            for (let i = 0; i < this.players.length; i++) {
                // set the inner text to be the number of cards the player has
                hands[i].innerText = this.players[i].hand.toString();

                const parent = hands[i].parentElement ?? document.createElement("div");

                // if current player, add current
                if (this.gameState.currentPlayer === i) {
                    parent.classList.add("current");
                    parent.classList.remove("next");
                }
                // if next player, add next
                else if (this.nextPlayer() === i) {
                    parent.classList.add("next");
                    parent.classList.remove("current");
                }
                // if not current or next player, remove special styles
                else {
                    parent.classList.remove("current");
                    parent.classList.remove("next");
                }
            }

        }
    }

    /**
     * Get the cached game state
     */
    getGameState() {
        return this.gameState;
    }
}
