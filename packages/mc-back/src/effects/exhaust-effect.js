import {Effect} from './effect.js';

export class ExhaustEffect extends Effect {
    filterTarget(card) {
        return !card.exhausted &&
            super.filterTarget.apply(this, arguments);
    }
    async execute(_params) {
        const {selectedTarget} = this;

        selectedTarget.exhaust();

        await selectedTarget.refresh();

        const gameZone = selectedTarget.gameZone ||
            selectedTarget.controller?.gameZone ||
            selectedTarget.owner?.gameZone;
        if (gameZone) {
            await gameZone.refresh();
        }
    }
}