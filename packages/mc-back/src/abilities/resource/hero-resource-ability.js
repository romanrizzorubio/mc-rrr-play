import {MixinHeroAbility} from '../mixins/mixin-hero-ability.js';

import {ResourceAbility} from './resource-ability.js';

export class HeroResourceAbility extends MixinHeroAbility(ResourceAbility) {}