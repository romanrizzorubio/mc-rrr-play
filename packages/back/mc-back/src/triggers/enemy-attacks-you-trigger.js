import {MixinYouTrigger} from './mixins/mixin-you-trigger.js';
import {Trigger} from './base/trigger.js';

export class EnemyAttacksYouTrigger extends MixinYouTrigger(Trigger) {
    getYou(params) {
        const selectedTarget = params.effect?.selectedTarget;
        const attackTargets = Array.isArray(selectedTarget) ?
            selectedTarget :
            [selectedTarget];

        return attackTargets.find(target => this.isSuperhero(target, params));
    }
    canTrigger(params) {
        if (this.card.controller === params.player) {
            return super.canTrigger(params);
        }
    }
}
