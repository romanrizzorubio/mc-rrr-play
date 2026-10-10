import {
    TRIGGER_ATTACHED_GET_ATTACK_CONSEQUENCIAL,
    TRIGGER_CHARACTER_GET_ATTACK_CONSEQUENCIAL,
} from 'mc-shared';

import {Effect} from './effect.js';

export class GetAttackConsequencialEffect extends Effect {
    constructor({}) {
        super(arguments[0]);

        this.attackConsequencial = 0;
        this.modifyAttackConsequencial = 0;
    }
    getTriggersInit() {
        return super.getTriggersInit()
            .concat([
                TRIGGER_CHARACTER_GET_ATTACK_CONSEQUENCIAL,
                TRIGGER_ATTACHED_GET_ATTACK_CONSEQUENCIAL,
            ]);
    }
    async execute(_params) {
        this.attackConsequencial =
            (this.selectedTarget.attackConsequencial ?? 0) +
            this.modifyAttackConsequencial;
    }
}
