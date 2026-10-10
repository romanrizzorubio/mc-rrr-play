import {
    ABILITY_ACTION,
    ABILITY_ALTEREGO_ACTION,
    ABILITY_ALTEREGO_INTERRUPT,
    ABILITY_ALTEREGO_RESOURCE,
    ABILITY_ALTEREGO_RESPONSE,
    ABILITY_BOOST,
    ABILITY_CONSTANT,
    ABILITY_FORCED_INTERRUPT,
    ABILITY_FORCED_RESPONSE,
    ABILITY_HERO_ACTION,
    ABILITY_HERO_INTERRUPT,
    ABILITY_HERO_RESOURCE,
    ABILITY_HERO_RESPONSE,
    ABILITY_INTERRUPT,
    ABILITY_OPTION,
    ABILITY_RESOURCE,
    ABILITY_RESPONSE,
    ABILITY_SETUP,
    ABILITY_SPECIAL,
    ABILITY_WHEN_DEFEATED,
    ABILITY_WHEN_REVEALED,
    ABILITY_WHEN_REVEALED_ALTEREGO,
    ABILITY_WHEN_REVEALED_HERO,
} from 'mc-shared';
import {ActionAbility} from '../../abilities/actions/action-ability.js';
import {AlteregoActionAbility} from '../../abilities/actions/alterego-action-ability.js';
import {HeroActionAbility} from '../../abilities/actions/hero-action-ability.js';
import {ForcedInterruptAbility} from '../../abilities/interrupt/forced-interrupt-ability.js';
import {HeroInterruptAbility} from '../../abilities/interrupt/hero-interrupt-ability.js';
import {InterruptAbility} from '../../abilities/interrupt/interrupt-ability.js';
import {AlteregoInterruptAbility} from '../../abilities/interrupt/alterego-interrupt-ability.js';
import {BoostAbility} from '../../abilities/misc/boost-ability.js';
import {ConstantAbility} from '../../abilities/misc/constant-ability.js';
import {OptionAbility} from '../../abilities/misc/option-ability.js';
import {SetupAbility} from '../../abilities/misc/setup-ability.js';
import {SpecialAbility} from '../../abilities/misc/special-ability.js';
import {HeroResourceAbility} from '../../abilities/resource/hero-resource-ability.js';
import {ResourceAbility} from '../../abilities/resource/resource-ability.js';
import {AlteregoResourceAbility} from '../../abilities/resource/alterego-resource-ability.js';
import {ForcedResponseAbility} from '../../abilities/response/forced-response-ability.js';
import {HeroResponseAbility} from '../../abilities/response/hero-response-ability.js';
import {ResponseAbility} from '../../abilities/response/response-ability.js';
import {AlteregoResponseAbility} from '../../abilities/response/alterego-response-ability.js';
import {WhenDefeatedAbility} from '../../abilities/when/when-defeated-ability.js';
import {WhenRevealedAbility} from '../../abilities/when/when-revealed-ability.js';
import {
    WhenRevealedAlteregoAbility
} from '../../abilities/when/when-revealed-alterego-ability.js';
import {WhenRevealedHeroAbility} from '../../abilities/when/when-revealed-hero-ability.js';

export const ABILITY_MAP = {
    [ABILITY_ACTION]: ActionAbility,
    [ABILITY_ALTEREGO_ACTION]: AlteregoActionAbility,
    [ABILITY_ALTEREGO_INTERRUPT]: AlteregoInterruptAbility,
    [ABILITY_ALTEREGO_RESOURCE]: AlteregoResourceAbility,
    [ABILITY_ALTEREGO_RESPONSE]: AlteregoResponseAbility,
    [ABILITY_BOOST]: BoostAbility,
    [ABILITY_CONSTANT]: ConstantAbility,
    [ABILITY_FORCED_INTERRUPT]: ForcedInterruptAbility,
    [ABILITY_FORCED_RESPONSE]: ForcedResponseAbility,
    [ABILITY_HERO_ACTION]: HeroActionAbility,
    [ABILITY_HERO_INTERRUPT]: HeroInterruptAbility,
    [ABILITY_HERO_RESOURCE]: HeroResourceAbility,
    [ABILITY_HERO_RESPONSE]: HeroResponseAbility,
    [ABILITY_INTERRUPT]: InterruptAbility,
    [ABILITY_OPTION]: OptionAbility,
    [ABILITY_RESOURCE]: ResourceAbility,
    [ABILITY_RESPONSE]: ResponseAbility,
    [ABILITY_SETUP]: SetupAbility,
    [ABILITY_SPECIAL]: SpecialAbility,
    [ABILITY_WHEN_DEFEATED]: WhenDefeatedAbility,
    [ABILITY_WHEN_REVEALED]: WhenRevealedAbility,
    [ABILITY_WHEN_REVEALED_ALTEREGO]: WhenRevealedAlteregoAbility,
    [ABILITY_WHEN_REVEALED_HERO]: WhenRevealedHeroAbility,
};
