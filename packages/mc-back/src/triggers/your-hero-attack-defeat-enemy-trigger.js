import {Trigger} from './base/trigger.js';
import {MixinAttackTrigger} from './mixins/mixin-attack-trigger.js';
import {MixinEnemyTrigger} from './mixins/mixin-enemy-trigger.js';
import {MixinYouDefeatTrigger} from './mixins/mixin-you-defeat-trigger.js';
import {MixinYourHeroTrigger} from './mixins/mixin-your-hero-trigger.js';

export class YourHeroAttackDefeatEnemyTrigger extends
    MixinEnemyTrigger(
        MixinAttackTrigger(
            MixinYouDefeatTrigger(
                MixinYourHeroTrigger(Trigger)
            )
        )
    ) {
    getYou(params) {
        const {effect} = params;

        return effect.activation.character;
    }
}