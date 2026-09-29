import {Effect} from "./effect.js";

export const EFFECT_REMOVE_CARD = 'remove-card';
export class RemoveCardEffect extends Effect {
    async execute(params) {
        const {selectedTarget} = this;

        await selectedTarget.remove();

        selectedTarget.refresh();
    }
}