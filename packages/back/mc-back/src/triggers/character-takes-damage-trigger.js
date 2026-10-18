import {getTriggerCardPlayer} from '../utils/trigger-card-player.js';
import {
    CharacterWouldTakeDamageTrigger
} from './character-would-take-damage-trigger.js';

export class CharacterTakesDamageTrigger extends CharacterWouldTakeDamageTrigger {
    getTarget(params) {
        const player = getTriggerCardPlayer(this.card, params.player);

        return super.getTarget({...params, player});
    }
    getAbilityParams(params) {
        const player = getTriggerCardPlayer(this.card, params.player);
        const abilityParams = super.getAbilityParams({...params, player});
        const attack = params.effect?.activation?.effect ?? params.attack;

        return {
            ...abilityParams,
            player,
            ...(attack ? {attack} : {}),
        };
    }
}
