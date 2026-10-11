import {Effect} from './effect.js';
import {checkCondition, path} from '../engine/utils.js';

export class CannotEffect extends Effect {
    constructor({restriction, sourceIn, targetCondition, ...params}) {
        super(params);

        if (typeof restriction !== 'string' || restriction.length === 0) {
            throw new TypeError('CannotEffect requires a restriction name.');
        }
        if (sourceIn !== undefined &&
            (typeof sourceIn !== 'string' || sourceIn.length === 0)) {
            throw new TypeError('CannotEffect sourceIn must be a non-empty path.');
        }
        if (targetCondition !== undefined &&
            (!targetCondition || typeof targetCondition !== 'object' ||
                Array.isArray(targetCondition))) {
            throw new TypeError('CannotEffect targetCondition must be an object.');
        }

        this.restriction = restriction;
        this.sourceIn = sourceIn;
        this.targetCondition = targetCondition;
    }
    canRun(params) {
        if (params.restrictions?.[this.restriction] !== true) {
            return false;
        }

        const target = params.triggeredCard || params.card;
        if (this.targetCondition &&
            !checkCondition(target, this.targetCondition)) {
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
