import {Effect} from "./effect.js";
import {checkCondition} from "../engine/utils.js";
import {DiscardFromDeckEffect} from "./discard-from-deck-effect.js";
import {AddHandEffect} from "./add-hand-effect.js";

export const EFFECT_DISCARD_DRAW = 'discard-draw';
export class DiscardDrawEffect extends Effect {
    constructor({
// DiscardDrawEffect
        count = 1,
        condition
    }) {
        super(arguments[0]);

        this.count = count;
        this.condition = condition;
    }
    checkCondition(card) {
        return checkCondition(card, this.condition);
    }

    async execute(params) {
        const {player} = params;
        const {count} = this;

        const discardFromDeckEffect = new DiscardFromDeckEffect({
            count,
            match: this.match,
        });

        await discardFromDeckEffect.runEffect({player})

        const matched = discardFromDeckEffect.cards.filter(this.checkCondition.bind(this));
        matched.forEach(card => {
            let index = player.deck.discardPile.findIndex(_card => _card.id === card.id);
            if (index > -1) {
                player.deck.discardPile.splice(index, 1);
            } else {
                index = player.deck.cards.findIndex(_card => _card.id === card.id);
                if (index > -1) {
                    player.deck.cards.splice(index, 1);
                }
            }
        });

        const addHandEffect = new AddHandEffect({
            match: this.match,
        });
        await addHandEffect.runEffect({
            cards: matched,
            player,
        });
    }
}