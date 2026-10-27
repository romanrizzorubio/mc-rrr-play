import {Trigger} from './base/trigger.js';

export class AttachedActivatesTrigger extends Trigger {
    canTrigger(params) {
        const attachedTo = this.card?.attachedTo;
        const activation = params.effect;
        const activatingCharacter = activation?.character;

        if (!attachedTo ||
            attachedTo.id !== activatingCharacter?.id ||
            activation?.resolved !== true ||
            activation.canceled ||
            activation.activationInterrupted) {
            return false;
        }

        return super.canTrigger(params);
    }
}
