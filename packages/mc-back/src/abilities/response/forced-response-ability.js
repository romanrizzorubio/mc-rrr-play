import { PRIORITY_FORCED_RESPONSE} from '../../constants/priorities.js';

import {ResponseAbility} from './response-ability.js';

export class ForcedResponseAbility extends ResponseAbility {
    initTriggers(card) {
        this.initTrigger({
            type: this.trigger,
            priority: PRIORITY_FORCED_RESPONSE,
            ability: this,
            card
        });
    }
}