import {Effect} from "./effect.js";

export const EFFECT_READY = 'ready';
export class ReadyEffect extends Effect {
    filterTarget(card) {
        return card.exhausted &&
            super.filterTarget.apply(this, arguments);
    }
    async execute(params) {
        const {selectedTarget} = this;

        if (selectedTarget) {
            await selectedTarget.ready();
            selectedTarget.refresh();
        }
    }
}