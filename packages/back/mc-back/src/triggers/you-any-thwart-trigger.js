import {Trigger} from './base/trigger.js';
import {MixinThwartTrigger} from './mixins/mixin-thwart-trigger.js';
import {MixinYouTrigger} from './mixins/mixin-you-trigger.js';

export class YouAnyThwartTrigger extends MixinThwartTrigger(MixinYouTrigger(Trigger)) {
    getYou(params) {
        const {effect} = params;
        return effect.character;
    }
}
