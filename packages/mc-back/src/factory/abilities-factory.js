import {Arrow} from "../abilities/core/arrow.js";
import {ABILITY_ACTION, ActionAbility} from "../abilities/actions/action-ability.js";
import {ABILITY_ALTEREGO_ACTION, AlteregoActionAbility} from "../abilities/actions/alterego-action-ability.js";
import {ABILITY_BOOST, BoostAbility} from "../abilities/misc/boost-ability.js";
import {ABILITY_CONSTANT, ConstantAbility} from "../abilities/misc/constant-ability.js";
import {ABILITY_FORCED_INTERRUPT, ForcedInterruptAbility} from "../abilities/interrupt/forced-interrupt-ability.js";
import {ABILITY_FORCED_RESPONSE, ForcedResponseAbility} from "../abilities/response/forced-response-ability.js";
import {ABILITY_HERO_ACTION, HeroActionAbility} from "../abilities/actions/hero-action-ability.js";
import {ABILITY_HERO_INTERRUPT, HeroInterruptAbility} from "../abilities/interrupt/hero-interrupt-ability.js";
import {ABILITY_HERO_RESOURCE, HeroResourceAbility} from "../abilities/resource/hero-resource-ability.js";
import {ABILITY_INTERRUPT, InterruptAbility} from "../abilities/interrupt/interrupt-ability.js";
import {ABILITY_OPTION, OptionAbility} from "../abilities/misc/option-ability.js";
import {ABILITY_RESOURCE, ResourceAbility} from "../abilities/resource/resource-ability.js";
import {ABILITY_RESPONSE, ResponseAbility} from "../abilities/response/response-ability.js";
import {ABILITY_SETUP, SetupAbility} from "../abilities/misc/setup-ability.js";
import {ABILITY_SPECIAL, SpecialAbility} from "../abilities/misc/special-ability.js";
import {ABILITY_WHEN_DEFEATED, WhenDefeatedAbility} from "../abilities/when/when-defeated-ability.js";
import {ABILITY_WHEN_REVEALED, WhenRevealedAbility} from "../abilities/when/when-revealed-ability.js";
import {
    ABILITY_WHEN_REVEALED_ALTEREGO,
    WhenRevealedAlteregoAbility
} from "../abilities/when/when-revealed-alterego-ability.js";
import {ABILITY_WHEN_REVEALED_HERO, WhenRevealedHeroAbility} from "../abilities/when/when-revealed-hero-ability.js";
import {EffectsFactory} from "./effects-factory.js";

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

        switch (type) {
            case ABILITY_ACTION:
                return new ActionAbility(params);
            case ABILITY_ALTEREGO_ACTION:
                return new AlteregoActionAbility(params);
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
        }
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
        }
    }
}
