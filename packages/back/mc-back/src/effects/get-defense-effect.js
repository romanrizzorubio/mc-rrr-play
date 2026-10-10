import {
    TRIGGER_CONDITION_GET_DEFENSE,
    TRIGGER_YOUR_HERO_GET_DEFENSE,
} from 'mc-shared';

import {Effect} from './effect.js';

export class GetDefenseEffect extends Effect {
    constructor({}) {
        super(arguments[0]);

        this.defense = 0;
        this.modifyDefense = 0;
    }
    getTriggersInit() {
        return super.getTriggersInit()
            .concat([
                TRIGGER_CONDITION_GET_DEFENSE,
                TRIGGER_YOUR_HERO_GET_DEFENSE,
            ]);
    }
    async execute(_params) {
        const {selectedTarget, modifyDefense} = this;

        this.defense = selectedTarget.defense + modifyDefense;
    }
}