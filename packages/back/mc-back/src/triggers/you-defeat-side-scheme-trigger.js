import {Trigger} from './base/trigger.js';
import {MixinYouTrigger} from './mixins/mixin-you-trigger.js';

export class YouDefeatSideSchemeTrigger extends MixinYouTrigger(Trigger) {
    getYou(params) {
        const {effect} = params;

        return effect.character;
    }
}
