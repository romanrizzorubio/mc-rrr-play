import {
    ABILITY_HERO_RESOURCE,
    ABILITY_HERO_RESPONSE,
    ABILITY_ALTEREGO_INTERRUPT,
    ABILITY_ALTEREGO_RESOURCE,
    ABILITY_ALTEREGO_RESPONSE,
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
    ABILITY_ACTION,
    ABILITY_ALTEREGO_ACTION,
    ABILITY_BOOST,
    ABILITY_CONSTANT,
    ABILITY_FORCED_INTERRUPT,
    ABILITY_FORCED_RESPONSE,
    ABILITY_HERO_ACTION,
    ABILITY_HERO_INTERRUPT
} from '../constants/abilities.js';

import {ActionAbility} from '../abilities/actions/action-ability.js';
import {AlteregoActionAbility} from '../abilities/actions/alterego-action-ability.js';
import {HeroActionAbility} from '../abilities/actions/hero-action-ability.js';
import {Arrow} from '../abilities/core/arrow.js';
import {ForcedInterruptAbility} from '../abilities/interrupt/forced-interrupt-ability.js';
import {HeroInterruptAbility} from '../abilities/interrupt/hero-interrupt-ability.js';
import {InterruptAbility} from '../abilities/interrupt/interrupt-ability.js';
import {AlteregoInterruptAbility} from '../abilities/interrupt/alterego-interrupt-ability.js';
import {BoostAbility} from '../abilities/misc/boost-ability.js';
import {ConstantAbility} from '../abilities/misc/constant-ability.js';
import {OptionAbility} from '../abilities/misc/option-ability.js';
import {SetupAbility} from '../abilities/misc/setup-ability.js';
import {SpecialAbility} from '../abilities/misc/special-ability.js';
import {HeroResourceAbility} from '../abilities/resource/hero-resource-ability.js';
import {HeroResponseAbility} from '../abilities/response/hero-response-ability.js';
import {ResourceAbility} from '../abilities/resource/resource-ability.js';
import {AlteregoResourceAbility} from '../abilities/resource/alterego-resource-ability.js';
import {ForcedResponseAbility} from '../abilities/response/forced-response-ability.js';
import {ResponseAbility} from '../abilities/response/response-ability.js';
import {AlteregoResponseAbility} from '../abilities/response/alterego-response-ability.js';
import {WhenDefeatedAbility} from '../abilities/when/when-defeated-ability.js';
import {WhenRevealedAbility} from '../abilities/when/when-revealed-ability.js';
import {
    WhenRevealedAlteregoAbility
} from '../abilities/when/when-revealed-alterego-ability.js';
import {WhenRevealedHeroAbility} from '../abilities/when/when-revealed-hero-ability.js';

import {EffectsFactory} from './effects-factory.js';

export class AbilitiesFactory {
    constructor(cardsFactory) {
        this.cardsFactory = cardsFactory;

        this.effectsFactory = new EffectsFactory(this);
    }
    get match() {
        return this.cardsFactory.match;
    }
    createAbility(ability = {}) {
        const {type, params} = this._parseAbility(ability);

        params.match = this.match;

        const abilityInstance = (() => {
            switch (type) {
                case ABILITY_ACTION:
                    return new ActionAbility(params);
                case ABILITY_ALTEREGO_ACTION:
                    return new AlteregoActionAbility(params);
                case ABILITY_ALTEREGO_INTERRUPT:
                    return new AlteregoInterruptAbility(params);
                case ABILITY_ALTEREGO_RESOURCE:
                    return new AlteregoResourceAbility(params);
                case ABILITY_ALTEREGO_RESPONSE:
                    return new AlteregoResponseAbility(params);
                case ABILITY_BOOST:
                    return new BoostAbility(params);
                case ABILITY_CONSTANT:
                    return new ConstantAbility(params);
                case ABILITY_FORCED_INTERRUPT:
                    return new ForcedInterruptAbility(params);
                case ABILITY_FORCED_RESPONSE:
                    return new ForcedResponseAbility(params);
                case ABILITY_HERO_ACTION:
                    return new HeroActionAbility(params);
                case ABILITY_HERO_INTERRUPT:
                    return new HeroInterruptAbility(params);
                case ABILITY_HERO_RESOURCE:
                    return new HeroResourceAbility(params);
                case ABILITY_HERO_RESPONSE:
                    return new HeroResponseAbility(params);
                case ABILITY_INTERRUPT:
                    return new InterruptAbility(params);
                case ABILITY_OPTION:
                    return new OptionAbility(params);
                case ABILITY_RESOURCE:
                    return new ResourceAbility(params);
                case ABILITY_RESPONSE:
                    return new ResponseAbility(params);
                case ABILITY_SETUP:
                    return new SetupAbility(params);
                case ABILITY_SPECIAL:
                    return new SpecialAbility(params);
                case ABILITY_WHEN_DEFEATED:
                    return new WhenDefeatedAbility(params);
                case ABILITY_WHEN_REVEALED:
                    return new WhenRevealedAbility(params);
                case ABILITY_WHEN_REVEALED_ALTEREGO:
                    return new WhenRevealedAlteregoAbility(params);
                case ABILITY_WHEN_REVEALED_HERO:
                    return new WhenRevealedHeroAbility(params);
                default:
                    throw new Error(`Unknown ability type: ${type}`);
            }
        })();

        return abilityInstance;
    }
    _createArrow(arrow) {
        arrow.isArrow = true;

        return new Arrow({
            cost: arrow,
        });
    }
    _parseAbility({type, params} = {}) {
        let arrow;
        if (params.arrow) {
            params.arrow.params.match = this.match;
            arrow = this._createArrow(this.effectsFactory.parseEffect(params.arrow));
        }

        let effect;
        if (params.effect) {
            effect = this.effectsFactory.parseEffect(params.effect);
        }
        let ifNot;
        if (params.ifNot) {
            ifNot = this.effectsFactory.parseEffect(params.ifNot);
        }

        return {
            type,
            params: {
                ...params,
                arrow,
                effect,
                ifNot,
            }
        };
    }
}
