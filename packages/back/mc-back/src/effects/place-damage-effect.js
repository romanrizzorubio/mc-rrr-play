import {Effect} from './effect.js';
import {placeDamageTokens} from '../utils/token-mutations.js';

export class PlaceDamageEffect extends Effect {
    constructor({
        damage,
    }) {
        super(arguments[0]);

        this.damage = damage;
    }
    async execute(params) {
        const {selectedTarget} = this;

        const damage = this.paramsCalc ?
            await this.calculate(params) :
            this.damage || params.damage;

        placeDamageTokens(selectedTarget, damage);

        if (selectedTarget.attachedTo) {
            await selectedTarget.attachedTo.refresh();
        } else {
            await selectedTarget.refresh();
        }
    }
}