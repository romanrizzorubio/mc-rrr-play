import {TARGET_SCENARIO} from 'mc-shared';

import {Delayed} from '../engine/delayed.js';

import {Effect} from './effect.js';
import {EFFECT_RESOLUTION_CONTEXT} from '../utils/effect-resolution-context.js';

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
        const resolutionContext = params[EFFECT_RESOLUTION_CONTEXT];
        if (this.target === TARGET_SCENARIO &&
            resolutionContext &&
            typeof selectedTarget.resolveDelayedEffects === 'function') {
            resolutionContext.afterResolution.set(selectedTarget, () =>
                selectedTarget.resolveDelayedEffects({})
            );
        }
    }
}