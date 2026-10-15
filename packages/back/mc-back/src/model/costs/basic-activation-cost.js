import {TARGET_CARD} from 'mc-shared';
import {ExhaustEffect} from '../../effects/exhaust-effect.js';
import {Cost} from './cost.js';
import {COST_TYPE_BASIC_ACTIVATION} from './cost-constants.js';

export class BasicActivationCost extends Cost {
    constructor({match}) {
        super({type: COST_TYPE_BASIC_ACTIVATION, match});

        this.effect = new ExhaustEffect({
            match,
            target: TARGET_CARD,
        });
    }
    getEffect(params) {
        return this.markEffectAsCost(
            this.effect,
            params.ability || this.effect.ability
        );
    }
}
