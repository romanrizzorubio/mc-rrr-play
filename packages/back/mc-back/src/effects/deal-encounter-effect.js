import {Effect} from './effect.js';

export class DealEncounterEffect extends Effect {
    constructor({count = 1}) {
        super(arguments[0]);

        this.count = count;
    }
    async execute(_params) {
        const targets = Array.isArray(this.selectedTarget) ?
            this.selectedTarget : [this.selectedTarget];
        for (const target of targets) {
            const cards = await this.match.drawEncounterCards(this.count);
            target.gameZone.dealEncounterCard(cards);
            await target.gameZone.refresh();
        }
    }
}