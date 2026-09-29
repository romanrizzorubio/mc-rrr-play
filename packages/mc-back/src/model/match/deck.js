import {Engine} from "../../engine/engine.js";
import {CycleEffect} from "../../effects/cycle-effect.js";
import {checkCondition, path} from "../../engine/utils.js";

export class Deck extends Engine {
    constructor({
        owner,
        isPlayerDeck = false,
        isScenarioDeck = false,
    }) {
        super();

        this.owner = owner;
        this.isPlayerDeck = isPlayerDeck;
        this.isScenarioDeck = isScenarioDeck;

        this.cards = [];
        this.discardPile = [];
    }
    get match() {
        return path(this, 'owner.match');
    }
    get name() {
        const {owner} = this;

        return owner.name;
    }
    get objectToRefresh() {
        return 'deck';
    }
    addToDeck(cards) {
        this.cards = this.cards.concat(cards);
    }
    checkCycle() {
        if (!this.cards.length) {
            const cycleEffect = new CycleEffect({
                selectedTarget: this,
                match: this.match,
            });

            return cycleEffect.runEffect({})
        }
    }
    cycle() {
        this.addToDeck(this.discardPile.splice(0, this.discardPile.length));

        this.shuffle();
    }
    async discard(card) {
        if (card instanceof Array) {
            this.discardPile = this.discardPile.concat(card);
        } else {
            this.discardPile.push(card);
        }

        await this.checkCycle();
    }
    async discardUntil(condition, removeFromDiscard = false) {
        const {cards, discardPile} = this;

        let found;

        while(cards.length) {
            const card = cards.shift();

            if (checkCondition(card, condition)) {
                found = card;

                if (!removeFromDiscard) {
                    discardPile.push(card);
                }

                break;
            } else {
                discardPile.push(card);
            }
        }

        await this.checkCycle();

        return found;
    }
    async draw(count = 1) {
        let cards = this.cards.splice(0, count);

        await this.checkCycle();

        if (cards.length < count) {
            cards = cards.concat(await this.draw(count - cards.length))

            await this.checkCycle();
        }

        return cards;
    }
    getDiscardTop() {
        return this.discardPile[this.discardPile.length - 1];
    }
    initDeck(cards) {
        this.cards = cards;

        this.cards.forEach(card => {
            if (!card.owner) {
                card.owner = this.owner;
            }
        });

        this.shuffle();
    }
    isInDeck(condition) {
        return this.cards.filter(condition);
    }
    isInDiscard(condition) {
        return this.discardPile.filter(condition);
    }
    removeCardFromDeck(card) {
        const index = this.cards.indexOf(card);
        if (index > -1) {
            this.cards.splice(index, 1);
        }
    }
    async searchDeck(card) {
        const index = this.cards.indexOf(card);
        if (index > -1) {
            this.cards.splice(index, 1);
            await this.checkCycle();
        }
    }
    searchDiscard(card) {
        const index = this.discardPile.indexOf(card);
        if (index > -1) {
            this.discardPile.splice(index, 1);
        }
    }
    shuffle() {
        this.cards.sort(() => Math.random() - 0.5)
        this.cards.sort(() => Math.random() - 0.5)
        this.cards.sort(() => Math.random() - 0.5)
        this.cards.sort(() => Math.random() - 0.5)
        this.cards.sort(() => Math.random() - 0.5)
    }
    toObj() {
        const {cards, discardPile, name, isPlayerDeck, isScenarioDeck} = this;

        return {
            name,
            isPlayerDeck,
            isScenarioDeck,
            cards: cards.map(card => card.toObj(arguments[0])),
            discard: discardPile.map(card => card.toObj(arguments[0])),
        }
    }
}