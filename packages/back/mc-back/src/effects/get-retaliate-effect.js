import {TRIGGER_YOUR_HERO_GET_RETALIATE} from 'mc-shared';

import {Effect} from './effect.js';

export class GetRetaliateEffect extends Effect {
    constructor({}) {
        super(arguments[0]);

        this.retaliate = 0;
        this.modifyRetaliate = 0;
    }
    getTriggersInit() {
        return super.getTriggersInit()
            .concat([TRIGGER_YOUR_HERO_GET_RETALIATE]);
    }
    async execute() {
        const {selectedTarget, modifyRetaliate} = this;

        this.retaliate = selectedTarget.retaliate + modifyRetaliate;
    }
}
