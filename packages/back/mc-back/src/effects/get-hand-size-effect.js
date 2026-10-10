import {TRIGGER_YOUR_HERO_GET_HAND_SIZE} from 'mc-shared';

import {Effect} from './effect.js';

export class GetHandSizeEffect extends Effect {
    constructor({}) {
        super(arguments[0]);

        this.handSize = 0;
        this.modifyHandSize = 0;
    }
    getTriggersInit() {
        return super.getTriggersInit()
            .concat([
                TRIGGER_YOUR_HERO_GET_HAND_SIZE,
            ]);
    }
    async execute(_params) {
        const {selectedTarget, modifyHandSize} = this;

        this.handSize = selectedTarget.currentSide.handSize + modifyHandSize;
    }
}
