import {MixinYourHeroTrigger} from './mixins/mixin-your-hero-trigger.js';
import {Trigger} from './base/trigger.js';

export class YourSuperheroFlipsTrigger extends MixinYourHeroTrigger(Trigger) {
    getYou(params) {
        return params.triggeredCard;
    }
}
