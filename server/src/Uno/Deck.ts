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

    private topColor: CardColors;
    private topNumber: CardNumbers;

    constructor() {
        this.topColor = CardColors.WILD;
        this.topNumber = CardNumbers.WILD;

        this.reset();
        this.shuffle();
    }

    /**
     * Initializes the deck to its default state
     */
    reset(): void {
        this.deck = [];
        this.discardDeck = [];

        let colors = [CardColors.RED, CardColors.YELLOW, CardColors.GREEN, CardColors.BLUE];
        let numbers = [CardNumbers.ONE, CardNumbers.TWO, CardNumbers.THREE, CardNumbers.FOUR, CardNumbers.FIVE, CardNumbers.SIX, CardNumbers.SEVEN, CardNumbers.EIGHT, CardNumbers.NINE, CardNumbers.SKIP, CardNumbers.REVERSE, CardNumbers.ADD_2];

        for (let color of colors) {
            this.deck.push({ color, number: CardNumbers.ZERO });
            this.deck.push({ color: CardColors.WILD, number: CardNumbers.WILD });
            this.deck.push({ color: CardColors.WILD, number: CardNumbers.ADD_4 });
            for (let i = 0; i < 2; i++) {
                for (let number of numbers) {
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
            let j = Math.floor(Math.random() * (this.deck.length - i) + i);
            let tmp = this.deck[i];
            this.deck[i] = this.deck[j];
            this.deck[j] = tmp;
        }
    }

    /**
     * Discards a card to the discard pile
     * @param c The card to discard
     * @returns true if the card can be discarded, false if the card is not valid
     */
    discard(c: Card): boolean {
        // get top of discard deck
        // if discard deck is empty, set top to c
        const top = this.discardDeck[this.discardDeck.length - 1] ?? c;
        // check if card can be discarded
        // card can be discarded if:
        //  Colors match
        //  Numbers match
        //  Color is WILD
        //  Top color is WILD
        if (c.color === this.topColor || c.number === this.topNumber || c.color === CardColors.WILD || this.topColor === CardColors.WILD) {
            this.discardDeck.push(c);
            this.updateTop(c.color, c.number);
            return true;
        }
        return false;
    }

    updateTop(color: CardColors, number: CardNumbers): void {
        this.topColor = color;
        this.topNumber = number;
    }
}