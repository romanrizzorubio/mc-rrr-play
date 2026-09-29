import {Deck} from "./deck.js";

export class PlayerDeck extends Deck {
    constructor(owner) {
        super(owner);
    }
    toObj() {
        return {
            ...super.toObj(arguments[0])
        }
    }
}