import {Effect} from './effect.js';

export class DealEncounterEffect extends Effect {
    constructor({count = 1}) {
        super(arguments[0]);

        this.count = count;
    }
    async execute(_params) {
        const {selectedTarget} = this;

        const cards = await this.match.drawEncounterCards(this.count);

        selectedTarget.gameZone.dealEncounterCard(cards);
        await selectedTarget.gameZone.refresh();
    }
}