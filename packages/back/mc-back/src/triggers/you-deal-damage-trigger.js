import {TARGET_ENEMY} from 'mc-shared';

import {getTriggerCardPlayer} from '../utils/trigger-card-player.js';
import {CharacterTakesDamageTrigger} from './character-takes-damage-trigger.js';

export class YouDealDamageTrigger extends CharacterTakesDamageTrigger {
    constructor({target = TARGET_ENEMY, ...params}) {
        super({...params, target});
    }
    canTrigger(params) {
        const sourceCard = params.effect?.ability?.card;
        const player = getTriggerCardPlayer(
            this.card,
            params.player ?? this.card.owner
        );
        const sourcePlayer = sourceCard ?
            getTriggerCardPlayer(
                sourceCard,
                params.player ?? sourceCard.owner
            ) :
            params.effect?.character?.owner;

        if (!player?.isPlayer || sourcePlayer !== player) {
            return false;
        }

        return super.canTrigger({...params, player});
    }
}
