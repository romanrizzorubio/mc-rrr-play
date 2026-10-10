import {Effect} from './effect.js';
import {path} from '../engine/utils.js';

export class CannotEffect extends Effect {
    constructor({restriction, sourceIn, ...params}) {
        super(params);

        if (typeof restriction !== 'string' || restriction.length === 0) {
            throw new TypeError('CannotEffect requires a restriction name.');
        }
        if (sourceIn !== undefined &&
            (typeof sourceIn !== 'string' || sourceIn.length === 0)) {
            throw new TypeError('CannotEffect sourceIn must be a non-empty path.');
        }

        this.restriction = restriction;
        this.sourceIn = sourceIn;
    }
    canRun(params) {
        if (params.restrictions?.[this.restriction] !== true) {
            return false;
        }

        if (this.sourceIn) {
            const sourceCard = this.ability?.card;
            const sourceCollection = path(params, this.sourceIn);
            if (!sourceCard || !Array.isArray(sourceCollection) ||
                !sourceCollection.includes(sourceCard)) {
                return false;
            }
        }

        return super.canRun(params);
    }
    execute(params) {
        params.restrictions[this.restriction] = false;
    }
}
