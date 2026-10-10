import {Effect} from './effect.js';

export class ExhaustEffect extends Effect {
    filterTarget(card) {
        return !card.exhausted &&
            super.filterTarget.apply(this, arguments);
    }
    async execute() {
        const selectedTargets = Array.isArray(this.selectedTarget) ?
            this.selectedTarget :
            [this.selectedTarget];
        const gameZones = new Set();

        for (const target of selectedTargets) {
            target.exhaust();
            await target.refresh();

            const gameZone = target.gameZone ||
                target.controller?.gameZone ||
                target.owner?.gameZone;
            if (gameZone) {
                gameZones.add(gameZone);
            }
        }

        await this.promisesSequential([...gameZones], gameZone => gameZone.refresh());
    }
}