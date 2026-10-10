import {
    TRIGGER_ATTACHED_GET_THWART,
    TRIGGER_THIS_GET_THWART,
    TRIGGER_YOUR_HERO_GET_THWART
} from 'mc-shared';

import {Effect} from './effect.js';

export class GetThwartEffect extends Effect {
    constructor({}) {
        super(arguments[0]);

        this.thwart = 0;
        this.modifyThwart = 0;
    }
    getTriggersInit() {
        return super.getTriggersInit()
            .concat([
                TRIGGER_YOUR_HERO_GET_THWART,
                TRIGGER_THIS_GET_THWART,
                TRIGGER_ATTACHED_GET_THWART,
            ]);
    }
    async execute(_params) {
        const {selectedTarget, modifyThwart} = this;

        if (selectedTarget.thwart !== null) {
            this.thwart = selectedTarget.thwart + modifyThwart;
        }
    }
}