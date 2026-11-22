import {TARGET_ENGAGED} from 'mc-shared';
import {Trigger} from './base/trigger.js';
import {MixinTreacheryTrigger} from './mixins/mixin-treachery-trigger.js';

export class TreacheryRevealTrigger extends MixinTreacheryTrigger(Trigger) {
    constructor(params) {
        super(params);

        this.target = params.target;
    }
    canTrigger(params) {
        if (this.target === TARGET_ENGAGED) {
            const engaged = this.card?.engaged;
            const revealingPlayer = params.revealPlayer ?? params.player;
            if (!engaged || engaged !== revealingPlayer) {
                return false;
            }
        }

        return super.canTrigger(params);
    }
}