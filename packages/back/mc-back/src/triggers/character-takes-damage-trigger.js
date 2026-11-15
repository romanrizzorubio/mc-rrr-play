import {getTriggerCardPlayer} from '../utils/trigger-card-player.js';
import {targetMap} from '../targets/index.js';
import {
    CharacterWouldTakeDamageTrigger
} from './character-would-take-damage-trigger.js';

export class CharacterTakesDamageTrigger extends CharacterWouldTakeDamageTrigger {
    constructor({attacker, ...params}) {
        super(params);

        this.attacker = attacker;
    }
    canTrigger(params) {
        if (this.attacker) {
            const resolveAttacker = targetMap[this.attacker];
            if (!resolveAttacker) {
                throw new Error(`Unknown damage trigger attacker "${this.attacker}".`);
            }

            const attackers = resolveAttacker({
                ...params,
                params,
                ability: this.ability,
                card: this.card,
                match: params.match || this.card.match,
            });
            if (!attackers.includes(params.character)) {
                return false;
            }
        }

        return super.canTrigger(params);
    }
    getTarget(params, targetIndex) {
        const player = getTriggerCardPlayer(
            this.card,
            params.player ?? this.card.owner
        );

        return super.getTarget({...params, player}, targetIndex);
    }
    getAbilityParams(params, targetIndex) {
        const player = getTriggerCardPlayer(
            this.card,
            params.player ?? this.card.owner
        );
        const abilityParams = super.getAbilityParams(
            {...params, player},
            targetIndex
        );
        const attack = params.effect?.activation?.effect ?? params.attack;

        return {
            ...abilityParams,
            player,
            ...(attack ? {attack} : {}),
        };
    }
}
