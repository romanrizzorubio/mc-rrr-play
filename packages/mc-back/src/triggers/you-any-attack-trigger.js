import {Trigger} from './base/trigger.js';
import {MixinAttackTrigger} from './mixins/mixin-attack-trigger.js';
import {MixinYouTrigger} from './mixins/mixin-you-trigger.js';

export class YouAnyAttackTrigger extends MixinAttackTrigger(MixinYouTrigger(Trigger)) {
    getYou(params) {
        const {effect} = params;

        return effect.character;
    }
}
