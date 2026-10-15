import {Cost} from './cost.js';
import {COST_TYPE_ADDITIONAL} from './cost-constants.js';

export class AdditionalCost extends Cost {
    constructor({effect}) {
        super({type: COST_TYPE_ADDITIONAL, match: effect?.match});

        if (!effect || Array.isArray(effect) ||
            typeof effect.canRun !== 'function') {
            throw new TypeError('Additional cost must be a single effect.');
        }

        this.effect = effect;
    }
    getEffect(params) {
        return this.markEffectAsCost(this.effect, params.ability);
    }
}
