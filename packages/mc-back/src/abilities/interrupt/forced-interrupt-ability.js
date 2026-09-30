import {PRIORITY_FORCED_INTERRUPT} from '../../constants/priorities.js';

import {InterruptAbility} from './interrupt-ability.js';

export class ForcedInterruptAbility extends InterruptAbility {
    initTriggers(card) {
        this.initTrigger({
            type: this.trigger,
            priority: PRIORITY_FORCED_INTERRUPT,
            ability: this,
            card
        });
    }
}