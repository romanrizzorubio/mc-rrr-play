import {MixinYouTrigger} from './mixins/mixin-you-trigger.js';
import {VillainAttacksTrigger} from './villain-attacks-trigger.js';
import {getTriggerCardPlayer} from '../utils/trigger-card-player.js';

export class VillainAttacksYouTrigger extends MixinYouTrigger(VillainAttacksTrigger) {
    getYou(params) {
        const {effect} = params;
        if (effect?.resolved) {
            const cardPlayer = this.card ?
                getTriggerCardPlayer(this.card, params.player) :
                undefined;
            const player = cardPlayer?.isPlayer ? cardPlayer : params.player;

            return effect.attackedCharacters.find(target =>
                this.isSuperhero(target, {...params, player}));
        }

        return effect?.attackTarget ?? super.getYou(params);
    }
    canTrigger(params) {
        const target = this.getYou(params);
        const player = target?.isPlayer ? target :
            target?.controller?.isPlayer ? target.controller :
                target?.owner?.isPlayer ? target.owner :
                    undefined;

        return super.canTrigger({
            ...params,
            ...(player ? {player} : {}),
        });
    }
    getInterruptName(params) {
        return `${this.getVillain(params).name} te va a atacar.`;
    }
}