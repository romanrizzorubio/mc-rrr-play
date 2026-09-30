import {MixinHeroAbility} from '../mixins/mixin-hero-ability.js';

import {InterruptAbility} from './interrupt-ability.js';

export class HeroInterruptAbility extends MixinHeroAbility(InterruptAbility) {
}