import {Effect} from './effect.js';

export class PlaceDamageEffect extends Effect {
    constructor({
        damage,
    }) {
        super(arguments[0]);

        this.damage = damage;
    }
    async execute(params) {
        const {selectedTarget} = this;

        const damage = this.damage || params.damage;

        selectedTarget.placeDamage(damage);

        if (selectedTarget.attachedTo) {
            await selectedTarget.attachedTo.refresh();
        } else {
            await selectedTarget.refresh();
        }
    }
}