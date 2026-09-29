import {InterruptAbility} from "./interrupt-ability.js";
import {PRIORITY_FORCED_INTERRUPT} from "../../constants/priorities.js";

export const ABILITY_FORCED_INTERRUPT = 'forced-interrupt';
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