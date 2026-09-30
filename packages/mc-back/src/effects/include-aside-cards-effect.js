import {
    PLACE_ASIDE_MATCH,
    PLACE_OUTSIDE_NEMESIS
} from '../constants/places.js';
import {TARGET_SCENARIO} from '../constants/targets.js';
import {checkCondition} from '../engine/utils.js';
import {ValidTarget} from '../targets/valid-target.js';

import {Effect} from './effect.js';

export class IncludeAsideCardsEffect extends Effect {
    constructor({
        condition,
        cards,
        owner,
        from = PLACE_ASIDE_MATCH,
        ownerTarget = TARGET_SCENARIO,
    }) {
        super(arguments[0]);

        this.condition = condition;
        this.from = from;
        this.cards = cards;
        this.owner = owner;
        this.ownerTarget = ownerTarget;
    }
    filterTarget(card) {
        if (super.filterTarget.apply(this, arguments)) {
            const {condition} = this;

            if (condition) {
                return checkCondition(card, condition);
            }

            return true;
        }

        return false;
    }
    removeIncluded(place, cards, player) {
        switch (place) {
            case PLACE_OUTSIDE_NEMESIS:
                cards.forEach(card => {
                    const index = player.superhero.nemesis.indexOf(card);
                    if (index > -1) {
                        player.superhero.nemesis.splice(index, 1);
                    }
                });
        }
    }
    async prepare(params) {
        await super.prepare(params);

        const {player} = params;
        const {from, ownerTarget} = this;

        const validTarget = new ValidTarget({
            match: this.match,
            multipleTarget: true,
        });

        this.cards = await validTarget.selectTarget({
            target: from,
            player,
        });

        validTarget.multipleTarget = false;
        this.owner = await validTarget.selectTarget({
            target: ownerTarget,
            player,
        });
    }
    async execute(params) {
        const {cards, selectedTarget, owner, from} = this;
        const {player} = params;

        cards.forEach(card => {
            card.owner = owner;
        });

        this.removeIncluded(from, cards, player);

        selectedTarget.addToDeck(cards);

        selectedTarget.refresh();
    }
}