import {EFFECT_CATEGORY_LEAVE_PLAY} from 'mc-shared';

import {Effect} from './effect.js';

export class RemoveCardEffect extends Effect {
    get effectCategories() {
        return [EFFECT_CATEGORY_LEAVE_PLAY];
    }
    async execute() {
        const {selectedTarget} = this;

        await selectedTarget.remove();

        selectedTarget.refresh();
    }
}