import {EFFECT_CATEGORY_LEAVE_PLAY} from 'mc-shared';

import {Effect} from './effect.js';

export class DiscardFromGameEffect extends Effect {
    get effectCategories() {
        return [EFFECT_CATEGORY_LEAVE_PLAY];
    }
    async execute(_params) {
        const targets = Array.isArray(this.selectedTarget) ?
            this.selectedTarget : [this.selectedTarget];
        for (const target of targets) {
            const {attachedTo, controller} = target;
            await target.discard();
            if (attachedTo) {
                await attachedTo.refresh();
            } else if (controller) {
                await controller.gameZone.refresh();
            }
            if (controller) {
                await controller.deck.refresh();
            }
        }
    }
}