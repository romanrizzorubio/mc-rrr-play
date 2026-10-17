import {MixinYouTrigger} from './mixin-you-trigger.js';
import {getTriggerCardPlayer} from '../../utils/trigger-card-player.js';

export const MixinYourHeroTrigger = C => class extends MixinYouTrigger(C) {
    constructor(params) {
        super(params);
    }
    canTrigger(params) {
        const {player} = params;
        const controller = getTriggerCardPlayer(this.card, player);

        if (player.isHero && controller === player) {
            return super.canTrigger(params);
        }
    }
};