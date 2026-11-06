import {Effect} from './effect.js';
import {path} from '../engine/utils.js';

export class ModifyBoostIconsEffect extends Effect {
    constructor({count = 0, countedCard}) {
        super(arguments[0]);

        this.count = count;
        this.countedCard = countedCard;
    }
    getBoostEffect(params) {
        return [
            params.effect,
            params.triggeredEffect,
            this.selectedTarget,
            ...(params.parentTargets || []),
        ].find(effect => Number.isFinite(effect?.boostValue));
    }
    async canRun(params) {
        return Boolean(this.getBoostEffect(params)) && super.canRun(params);
    }
    async execute(params) {
        const selectedTarget = this.getBoostEffect(params);
        const count = this.paramsCalc ?
            await this.calculate(params) :
            this.count;

        if (!Number.isFinite(count)) {
            throw new TypeError('ModifyBoostIconsEffect count must be finite.');
        }
        if (!Number.isFinite(selectedTarget?.boostValue)) {
            throw new TypeError(
                'ModifyBoostIconsEffect requires a boost resolution target.'
            );
        }

        let countedCard;
        if (this.countedCard !== undefined) {
            countedCard = typeof this.countedCard === 'string' ?
                path(params, this.countedCard) :
                this.countedCard;
            if (!countedCard ||
                typeof countedCard !== 'object' ||
                Array.isArray(countedCard)) {
                throw new TypeError(
                    'ModifyBoostIconsEffect countedCard must resolve to one card.'
                );
            }
        }

        selectedTarget.boostValue = Math.max(
            0,
            selectedTarget.boostValue + count
        );
        if (countedCard) {
            selectedTarget.displayCard = countedCard;
        }
    }
}
