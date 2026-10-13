import {Trigger} from './base/trigger.js';
import {MixinYouTrigger} from './mixins/mixin-you-trigger.js';

export class EngageHeroTrigger extends MixinYouTrigger(Trigger) {
    canTrigger(params) {
        const player = params.effect?.selectedTarget;

        if (player?.isHero) {
            return super.canTrigger({
                ...params,
                player,
            });
        }
    }
    getAbilityParams(params) {
        return super.getAbilityParams({
            ...params,
            player: params.effect?.selectedTarget,
        });
    }
}