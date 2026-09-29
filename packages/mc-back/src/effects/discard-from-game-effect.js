import {Effect} from "./effect.js";

export const EFFECT_DISCARD_GAME = 'discard-game';
export class DiscardFromGameEffect extends Effect {
    async execute(params) {
        const {selectedTarget} = this;

        const {attachedTo, controller} = selectedTarget;

        await selectedTarget.discard();

        if (attachedTo) {
            attachedTo.refresh();
        } else {
            controller && controller.gameZone.refresh();
        }

        controller && controller.deck.refresh();
    }
}