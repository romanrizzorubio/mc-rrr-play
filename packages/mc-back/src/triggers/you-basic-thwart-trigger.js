import {Trigger} from './base/trigger.js';
import {MixinBasicTrigger} from './mixins/mixin-basic-trigger.js';
import {MixinThwartTrigger} from './mixins/mixin-thwart-trigger.js';
import {MixinYouTrigger} from './mixins/mixin-you-trigger.js';

export class YouBasicThwartTrigger extends MixinBasicTrigger(MixinThwartTrigger(MixinYouTrigger(Trigger))) {
    getYou(params) {
        const {effect} = params;
        return effect.character;
    }
}
