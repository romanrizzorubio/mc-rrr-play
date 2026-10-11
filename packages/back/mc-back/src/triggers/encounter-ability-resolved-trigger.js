import {Trigger} from './base/trigger.js';

export class EncounterAbilityResolvedTrigger extends Trigger {
    canTrigger(params) {
        const attachedTo = this.card.attachedTo?.currentSide ||
            this.card.attachedTo;

        if (!params.revealedAbility?.isWhenRevealed ||
            params.player !== attachedTo?.owner) {
            return false;
        }

        return super.canTrigger(params);
    }
}
