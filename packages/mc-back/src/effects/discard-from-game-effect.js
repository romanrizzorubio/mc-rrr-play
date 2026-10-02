import {Effect} from './effect.js';

export class DiscardFromGameEffect extends Effect {
    async execute(_params) {
        const {selectedTarget} = this;

        const {attachedTo, controller} = selectedTarget;

        await selectedTarget.discard();

        if (attachedTo) {
            attachedTo.refresh();
        } else {
            if (controller) {
                await controller.gameZone.refresh();
            }
        }

        controller && controller.deck.refresh();
    }
}