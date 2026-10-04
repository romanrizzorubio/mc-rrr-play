import {MixinYouTrigger} from './mixin-you-trigger.js';

export const MixinYourHeroTrigger = C => class extends MixinYouTrigger(C) {
    constructor(params) {
        super(params);
    }
    canTrigger(params) {
        const {player} = params;

        if (player.isHero && this.card.controller === player) {
            return super.canTrigger(params);
        }
    }
};