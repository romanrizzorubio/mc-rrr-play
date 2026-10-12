import {GetRecoveryEffect} from './get-recovery-effect.js';

import {Effect} from './effect.js';

export class ModifyRecoveryEffect extends Effect {
    constructor({
        count,
    }) {
        super(arguments[0]);

        this.count = count;
    }
    execute() {
        if (!(this.selectedTarget instanceof GetRecoveryEffect)) {
            throw new TypeError('ModifyRecoveryEffect requires a recovery calculation target.');
        }

        this.selectedTarget.modifyRecovery += this.count;
    }
}
