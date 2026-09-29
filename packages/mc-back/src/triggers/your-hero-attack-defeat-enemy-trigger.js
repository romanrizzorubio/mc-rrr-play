import {Trigger} from "./base/trigger.js";
import {MixinYourHeroTrigger} from "./mixins/mixin-your-hero-trigger.js";
import {MixinEnemyTrigger} from "./mixins/mixin-enemy-trigger.js";
import {MixinAttackTrigger} from "./mixins/mixin-attack-trigger.js";
import {MixinYouDefeatTrigger} from "./mixins/mixin-you-defeat-trigger.js";

export const TRIGGER_YOUR_HERO_ATTACK_DEFEAT_ENEMY = 'YOUR_HERO_ATTACK_DEFEAT_ENEMY';
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