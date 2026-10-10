import {Trigger} from './base/trigger.js';
import {MixinMinionTrigger} from './mixins/mixin-minion-trigger.js';
import {MixinYouTrigger} from './mixins/mixin-you-trigger.js';

export class YouDefeatMinionTrigger extends MixinMinionTrigger(MixinYouTrigger(Trigger)) {
    getYou(params) {
        const {effect} = params;

        return effect.character;
    }
}