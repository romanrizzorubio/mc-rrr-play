import {TRIGGER_YOUR_PLAYER_GET_MAX_ALLIES} from 'mc-shared';

import {Effect} from './effect.js';

export class GetMaxAlliesEffect extends Effect {
    constructor({}) {
        super(arguments[0]);

        this.maxAllies = 3;
        this.modifyMaxAllies = 0;
    }
    getTriggersInit() {
        return super.getTriggersInit()
            .concat([
                TRIGGER_YOUR_PLAYER_GET_MAX_ALLIES,
            ]);
    }
    async execute(_params) {
        const {modifyMaxAllies} = this;

        this.maxAllies = 3 + modifyMaxAllies;
    }
}