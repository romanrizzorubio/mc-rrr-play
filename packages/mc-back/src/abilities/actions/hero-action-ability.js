import {MixinHeroAbility} from '../mixins/mixin-hero-ability.js';

import {ActionAbility} from './action-ability.js';

export class HeroActionAbility extends MixinHeroAbility(ActionAbility) {}