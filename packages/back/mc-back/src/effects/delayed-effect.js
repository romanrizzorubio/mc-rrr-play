import {Delayed} from '../engine/delayed.js';

import {Effect} from './effect.js';

export class DelayedEffect extends Effect {
    constructor({
        effect,
    }) {
        super(arguments[0]);

        this.effect = effect;
    }

    execute(params) {
        const {card, player} = params;
        const {selectedTarget, effect} = this;

        selectedTarget.createDelayedEffect(new Delayed({
            effect,
            card,
            player,
        }));
    }
}