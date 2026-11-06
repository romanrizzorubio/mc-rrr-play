import {Trigger} from './base/trigger.js';

export class ThisActivatesTrigger extends Trigger {
    canTrigger(params) {
        const activation = params.effect;
        const activatingCharacter = activation?.character;
        const isThisCharacter = this.card === activatingCharacter ||
            (this.card?.id !== undefined &&
                this.card.id === activatingCharacter?.id);

        if (!isThisCharacter ||
            activation?.resolved !== true ||
            activation.canceled ||
            activation.activationInterrupted) {
            return false;
        }

        return super.canTrigger(params);
    }
}
