import {Trigger} from './base/trigger.js';
import {MixinBasicTrigger} from './mixins/mixin-basic-trigger.js';
import {MixinAttackTrigger} from './mixins/mixin-attack-trigger.js';
import {MixinYouTrigger} from './mixins/mixin-you-trigger.js';

export class YouBasicAttackTrigger extends MixinBasicTrigger(MixinAttackTrigger(MixinYouTrigger(Trigger))) {
    getYou(params) {
        const {effect} = params;
        return effect.character;
    }
}
