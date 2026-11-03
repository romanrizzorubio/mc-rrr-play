import {TARGET_SCENARIO, TRIGGER_PHASE_ENDS} from 'mc-shared';

import {Delayed} from '../engine/delayed.js';

import {Effect} from './effect.js';
import {EFFECT_RESOLUTION_CONTEXT} from '../utils/effect-resolution-context.js';

export class DelayedEffect extends Effect {
    constructor({
        at,
        effect,
    }) {
        super(arguments[0]);

        if (at !== undefined &&
            (at !== TRIGGER_PHASE_ENDS || this.target !== TARGET_SCENARIO)) {
            throw new TypeError(
                'EFFECT_DELAYED with "at" requires TARGET_SCENARIO and TRIGGER_PHASE_ENDS.'
            );
        }

        this.at = at;
        this.effect = effect;
    }
    execute(params) {
        const {card, player} = params;
        const {selectedTarget, effect} = this;

        selectedTarget.createDelayedEffect(new Delayed({
            at: this.at,
            effect,
            card,
            player,
        }));
        const resolutionContext = params[EFFECT_RESOLUTION_CONTEXT];
        if (this.target === TARGET_SCENARIO &&
            this.at !== TRIGGER_PHASE_ENDS &&
            resolutionContext &&
            typeof selectedTarget.resolveDelayedEffects === 'function') {
            resolutionContext.afterResolution.set(selectedTarget, () =>
                selectedTarget.resolveDelayedEffects({}, {
                    afterResolution: true,
                })
            );
        }
    }
}