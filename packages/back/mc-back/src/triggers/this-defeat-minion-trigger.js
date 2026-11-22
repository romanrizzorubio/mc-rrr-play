import {Trigger} from './base/trigger.js';
import {MixinMinionTrigger} from './mixins/mixin-minion-trigger.js';
import {MixinThisTrigger} from './mixins/mixin-this-trigger.js';

export class ThisDefeatMinionTrigger extends MixinMinionTrigger(MixinThisTrigger(Trigger)) {
    canTrigger(params) {
        const {effect} = params;
        const defeatingCharacter = params.attack?.character ??
            effect?.activation?.character ??
            effect?.character;

        if (!defeatingCharacter) {
            return false;
        }

        return super.canTrigger({
            ...params,
            card: defeatingCharacter,
        });
    }
}
