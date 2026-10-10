import {MixinYouTrigger} from './mixin-you-trigger.js';

export const MixinYourHeroTrigger = C => class extends MixinYouTrigger(C) {
    constructor(params) {
        super(params);
    }
    canTrigger(params) {
        const {player} = params;
        const controller = this.card.isEvent ?
            this.card.owner :
            this.card.controller;

        if (player.isHero && controller === player) {
            return super.canTrigger(params);
        }
    }
};