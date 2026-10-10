import {Effect} from './effect.js';

export class StoreBoostEffect extends Effect {
    constructor({
        count = 1,
    }) {
        super(arguments[0]);

        this.count = count;
    }
    async execute(_params) {
        const {selectedTarget} = this;
        const cards = await this.match.drawEncounterCards(this.count);

        selectedTarget.addFaceDown(cards, {isFutureBoost: true});
        await selectedTarget.refresh();
    }
}
