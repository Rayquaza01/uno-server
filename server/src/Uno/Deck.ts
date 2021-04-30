import { Card } from "./Card";
import { CardColors } from "./CardColors";
import { CardNumbers } from "./CardNumbers";

/**
 * A class representing a deck of uno cards
 */
export class UnoDeck {
    /** The deck of cards */
    private deck: Card[] = [];
    /** The current discard pile */
    private discardDeck: Card[] = [];

    private discardTop: Card;

    constructor() {
        this.discardTop = {
            color: CardColors.WILD,
            number: CardNumbers.WILD
        };

        this.reset();
        this.shuffle();
    }

    /**
     * Initializes the deck to its default state
     */
    reset(): void {
        this.deck = [];
        this.discardDeck = [];

        const colors = [CardColors.RED, CardColors.YELLOW, CardColors.GREEN, CardColors.BLUE];
        const numbers = [CardNumbers.ONE, CardNumbers.TWO, CardNumbers.THREE, CardNumbers.FOUR, CardNumbers.FIVE, CardNumbers.SIX, CardNumbers.SEVEN, CardNumbers.EIGHT, CardNumbers.NINE, CardNumbers.SKIP, CardNumbers.REVERSE, CardNumbers.ADD_2];

        for (const color of colors) {
            this.deck.push({ color, number: CardNumbers.ZERO });
            this.deck.push({ color: CardColors.WILD, number: CardNumbers.WILD });
            this.deck.push({ color: CardColors.WILD, number: CardNumbers.ADD_4 });
            for (let i = 0; i < 2; i++) {
                for (const number of numbers) {
                    this.deck.push({ color, number });
                }
            }
        }
    }

    /**
     * Draws a random card from the deck and removes it
     */
    draw(): Card {
        // if no cards are left in the deck
        if (this.deck.length === 0) {
            // replace the deck with the discard deck
            this.deck = this.discardDeck;
            // reset the discard deck
            this.discardDeck = [];
            // move the top card from the deck back to the discard deck
            this.discardDeck.push(this.deck.pop() as Card);
            // re-shuffle the discard deck
            this.shuffle();
        }

        return this.deck.pop() as Card;
    }

    /**
     * Shuffles the current deck of cards
     */
    shuffle(): void {
        // fisher yates shuffle
        for (let i = 0; i < (this.deck.length - 2); i++) {
            // random number from current index to deck length
            const j = Math.floor(Math.random() * (this.deck.length - i) + i);
            const tmp = this.deck[i];
            this.deck[i] = this.deck[j];
            this.deck[j] = tmp;
        }
    }

    /**
     * Discards a card to the discard pile
     * @param c The card to discard
     * @param commit Should the card actually be discarded?
     * @returns true if the card can be discarded, false if the card is not valid
     */
    discard(c: Card, commit = true): boolean {
        // check if card can be discarded
        // card can be discarded if:
        //  Colors match
        //  Numbers match
        //  Color is WILD
        //  Top color is WILD
        if (c.color === this.discardTop.color || c.number === this.discardTop.number || c.color === CardColors.WILD || this.discardTop.color === CardColors.WILD) {
            if (commit) {
                this.discardDeck.push(c);
                this.updateTop(c.color, c.number);
            }
            return true;
        }
        return false;
    }

    updateTop(color: CardColors, number: CardNumbers): void {
        this.discardTop = { color, number };
    }

    getTop(): Card {
        return this.discardTop;
    }
}
