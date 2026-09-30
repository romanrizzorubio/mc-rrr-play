import {Effect} from './effect.js';

export class DealEncounterEffect extends Effect {
    async execute(_params) {
        const {selectedTarget} = this;

        const cards = await this.match.drawEncounterCards();

        selectedTarget.gameZone.dealEncounterCard(cards);
        selectedTarget.gameZone.refresh();
    }
}