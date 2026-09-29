import {Trigger} from "./base/trigger.js";
import {MixinTreacheryTrigger} from "./mixins/mixin-treachery-trigger.js";

export const TRIGGER_TREACHERY_REVEAL = 'TREACHERY_REVEAL';
export class TreacheryRevealTrigger extends MixinTreacheryTrigger(Trigger) {}