import {YouAnyAttackTrigger} from './you-any-attack-trigger.js';

export class YouAllyAttackTrigger extends YouAnyAttackTrigger {
    isSuperhero(character, {player}) {
        return character?.isAlly && character.controller === player;
    }
}
