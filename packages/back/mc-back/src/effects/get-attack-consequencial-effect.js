import {
    TRIGGER_ATTACHED_GET_ATTACK_CONSEQUENCIAL,
    TRIGGER_CHARACTER_GET_ATTACK_CONSEQUENCIAL,
} from 'mc-shared';

import {Effect} from './effect.js';

export class GetattackConsequentialEffect extends Effect {
    constructor({}) {
        super(arguments[0]);

        this.attackConsequential = 0;
        this.modifyattackConsequential = 0;
    }
    getTriggersInit() {
        return super.getTriggersInit()
            .concat([
                TRIGGER_CHARACTER_GET_ATTACK_CONSEQUENCIAL,
                TRIGGER_ATTACHED_GET_ATTACK_CONSEQUENCIAL,
            ]);
    }
    async execute(_params) {
        this.attackConsequential =
            (this.selectedTarget.attackConsequential ?? 0) +
            this.modifyattackConsequential;
    }
}
