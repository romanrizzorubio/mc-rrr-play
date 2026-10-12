import {TRIGGER_YOUR_ALTEREGO_GET_RECOVERY} from 'mc-shared';

import {Effect} from './effect.js';

export class GetRecoveryEffect extends Effect {
    constructor() {
        super(arguments[0]);

        this.recovery = 0;
        this.modifyRecovery = 0;
    }
    getTriggersInit() {
        return super.getTriggersInit()
            .concat([TRIGGER_YOUR_ALTEREGO_GET_RECOVERY]);
    }
    async execute() {
        this.recovery = this.selectedTarget.recovery + this.modifyRecovery;
    }
}
