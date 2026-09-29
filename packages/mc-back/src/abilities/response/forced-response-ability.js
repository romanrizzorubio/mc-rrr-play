import {ResponseAbility} from "./response-ability.js";
import {PRIORITY_FORCED_INTERRUPT, PRIORITY_FORCED_RESPONSE, PRIORITY_INTERRUPT} from "../../constants/priorities.js";

export const ABILITY_FORCED_RESPONSE = 'forced-response';
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