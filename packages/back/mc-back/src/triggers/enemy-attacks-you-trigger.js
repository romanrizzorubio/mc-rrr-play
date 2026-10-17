import {MixinYouTrigger} from './mixins/mixin-you-trigger.js';
import {Trigger} from './base/trigger.js';
import {getTriggerCardPlayer} from '../utils/trigger-card-player.js';

export class EnemyAttacksYouTrigger extends MixinYouTrigger(Trigger) {
    getYou(params) {
        const selectedTarget = params.effect?.selectedTarget;
        const attackTargets = Array.isArray(selectedTarget) ?
            selectedTarget :
            [selectedTarget];

        return attackTargets.find(target => this.isSuperhero(target, params));
    }
    async canTrigger(params) {
        const {player} = params;
        return Boolean(player &&
            getTriggerCardPlayer(this.card, player) === player &&
            await super.canTrigger(params));
    }
}
