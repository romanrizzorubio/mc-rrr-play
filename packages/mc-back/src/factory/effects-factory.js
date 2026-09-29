import {EFFECT_PREVENT_DAMAGE, PreventDamageEffect} from "../effects/prevent-damage-effect.js";
import {CancelAttackEffect, EFFECT_CANCEL_ATTACK} from "../effects/cancel-attack-effect.js";
import {CancelEncounterEffect, EFFECT_CANCEL_ENCOUNTER} from "../effects/cancel-encounter-effect.js";
import {ChainedEffect, EFFECT_CHAINED} from "../effects/chained-effect.js";
import {DiscardDrawEffect, EFFECT_DISCARD_DRAW} from "../effects/discard-draw-effect.js";
import {DiscardFromGameEffect, EFFECT_DISCARD_GAME} from "../effects/discard-from-game-effect.js";
import {DiscardFromHandEffect, EFFECT_DISCARD_HAND} from "../effects/discard-from-hand-effect.js";
import {DoIfCardGameEffect, EFFECT_DO_IF_CARD_GAME} from "../effects/do-if-card-game-effect.js";
import {
    DoIfTakeCharacterDamageEffect,
    EFFECT_DO_IF_TAKE_DAMAGE
} from "../effects/do-if-take-character-damage-effect.js";
import {DoIfHasDamageEffect, EFFECT_DO_IF_HAS_DAMAGE} from "../effects/do-if-has-damage-effect.js";
import {DrawEffect, EFFECT_DRAW_CARD} from "../effects/draw-effect.js";
import {EFFECT_EXHAUST, ExhaustEffect} from "../effects/exhaust-effect.js";
import {EFFECT_FACEDOWN, FaceDownEffect} from "../effects/facedown-effect.js";
import {EFFECT_FLIP, FlipEffect} from "../effects/flip-effect.js";
import {EFFECT_HEAL, HealEffect} from "../effects/heal-effect.js";
import {EFFECT_MODIFY_ATTACK, ModifyAttackEffect} from "../effects/modify-attack-effect.js";
import {EFFECT_PLACE_DAMAGE, PlaceDamageEffect} from "../effects/place-damage-effect.js";
import {EFFECT_PLACE_THREAT, PlaceThreatEffect} from "../effects/place-threat-effect.js";
import {EFFECT_REMOVE_CARD, RemoveCardEffect} from "../effects/remove-card-effect.js";
import {EFFECT_REMOVE_THREAT, RemoveThreatEffect} from "../effects/remove-threat-effect.js";
import {EFFECT_REMOVE_USE, RemoveCountersEffect} from "../effects/remove-counters-effect.js";
import {EFFECT_RETURN_FACEDOWN, ReturnFaceDownEffect} from "../effects/return-facedown-effect.js";
import {EFFECT_SEARCH_CARD_REVEAL, SearchCardAndRevealEffect} from "../effects/search-card-reveal-effect.js";
import {EFFECT_SPEND, SpendEffect} from "../effects/spend-effect.js";
import {EFFECT_SURGE, SurgeEffect} from "../effects/surge-effect.js";
import {EFFECT_STUN, StunEffect} from "../effects/stun-effect.js";
import {EFFECT_TOUGH, ToughEffect} from "../effects/tough-effect.js";
import {DelayedEffect, EFFECT_DELAYED} from "../effects/delayed-effect.js";
import {EFFECT_PREVENT_PLACE_DAMAGE, PreventPlaceDamageEffect} from "../effects/prevent-place-damage-effect.js";
import {EFFECT_ENEMY_ATTACK, EnemyAttackEffect} from "../effects/enemy-attack-effect.js";
import {EFFECT_SEVERAL_ATTACKS, SeveralAttacksEffect} from "../effects/several-attacks-effect.js";
import {EFFECT_INCLUDE_ASIDE_CARDS, IncludeAsideCardsEffect} from "../effects/include-aside-cards-effect.js";
import {DoIfEffect, EFFECT_DO_IF} from "../effects/do-if-effect.js";
import {EFFECT_RANDOM_CARD, RandomCardEffect} from "../effects/random-card-effect.js";
import {DiscardRandomEffect, EFFECT_DISCARD_RANDOM} from "../effects/discard-random-effect.js";
import {EFFECT_TAKE_DAMAGE, TakeDamageEffect} from "../effects/take-damage-effect.js";
import {ChooseEffect, EFFECT_CHOOSE} from "../effects/choose-effect.js";
import {AssignDamageEffect, EFFECT_ASSIGN_DAMAGE} from "../effects/assign-damage-effect.js";
import {ConfuseEffect, EFFECT_CONFUSE} from "../effects/confuse-effect.js";
import {ChooseAbilityEffect, EFFECT_CHOOSE_ABILITY} from "../effects/choose-ability-effect.js";
import {EFFECT_MAY, MayEffect} from "../effects/may-effect.js";
import {DealDamageEffect, EFFECT_DEAL_DAMAGE} from "../effects/deal-damage-effect.js";
import {EFFECT_PREVENT_PLACE_THREAT, PreventPlaceThreatEffect} from "../effects/prevent-place-threat-effect.js";
import {EFFECT_MODIFY_COST, ModifyCostEffect} from "../effects/modify-cost-effect.js";
import {EFFECT_LASTING, LastingEffect} from "../effects/lasting-effect.js";
import {EFFECT_READY, ReadyEffect} from "../effects/ready-effect.js";
import {EFFECT_MODIFY_THWART_VALUE, ModifyThwartValueEffect} from "../effects/modify-thwart-value-effect.js";
import {DoIfHasPaidEffect, EFFECT_DO_IF_HAS_PAID} from "../effects/do-if-has-paid-effect.js";
import {DiscardRevealEffect, EFFECT_DISCARD_REVEAL} from "../effects/discard-reveal-effect.js";
import {EFFECT_REVEAL_FIRST_ENCOUNTER, RevealFirstEncounterEffect} from "../effects/reveal-first-encounter-effect.js";
import {EFFECT_MODIFY_TRAITS, ModifyTraitsEffect} from "../effects/modify-traits-effect.js";
import {EFFECT_MODIFY_DEFENSE_VALUE, ModifyDefenseValueEffect} from "../effects/modify-defense-value-effect.js";
import {DoIfHasTraitsEffect, EFFECT_DO_IF_HAS_TRAITS} from "../effects/do-if-has-traits-effect.js";
import {EFFECT_SELECT_DISCARD_CARD, SelectDiscardCardEffect} from "../effects/select-discard-card-effect.js";
import {EFFECT_SPEND_X, SpendXEffect} from "../effects/spend-x-effect.js";
import {EFFECT_PLACE_COUNTER, PlaceCountersEffect} from "../effects/place-counters-effect.js";
import {DiscardConditionHandEffect, EFFECT_DISCARD_CONDITION_HAND} from "../effects/discard-condition-hand-effect.js";
import {DiscardFromDeckEffect, EFFECT_DISCARD_FROM_DECK} from "../effects/discard-from-deck-effect.js";
import {EFFECT_MODIFY_ATTACK_VALUE, ModifyAttackValueEffect} from "../effects/modify-attack-value-effect.js";
import {EFFECT_ENEMY_SCHEME, EnemySchemeEffect} from "../effects/enemy-scheme-effect.js";

export class EffectsFactory {
    constructor(abilitiesFactory) {
        this.abilitiesFactory = abilitiesFactory;
    }
    get match() {
        return this.abilitiesFactory.match;
    }
    createEffect(par = {}) {
        const {type, params = {}} = par;

        params.match = this.match;

        if (par instanceof Array) {
            return par.map(p => this.createEffect(p));
        } else {
            params.refreshTarget = true;

            switch (type) {
                case EFFECT_ASSIGN_DAMAGE:
                    return new AssignDamageEffect(params);
                case EFFECT_PREVENT_DAMAGE:
                    return new PreventDamageEffect(params);
                case EFFECT_PREVENT_PLACE_DAMAGE:
                    return new PreventPlaceDamageEffect(params);
                case EFFECT_PREVENT_PLACE_THREAT:
                    return new PreventPlaceThreatEffect(params);
                case EFFECT_CANCEL_ATTACK:
                    return new CancelAttackEffect(params);
                case EFFECT_CANCEL_ENCOUNTER:
                    return new CancelEncounterEffect(params);
                case EFFECT_CHAINED:
                    return new ChainedEffect(params);
                case EFFECT_CHOOSE:
                    return new ChooseEffect(params);
                case EFFECT_CHOOSE_ABILITY:
                    return new ChooseAbilityEffect(params);
                case EFFECT_CONFUSE:
                    return new ConfuseEffect(params);
                case EFFECT_DEAL_DAMAGE:
                    return new DealDamageEffect(params);
                case EFFECT_DISCARD_FROM_DECK:
                    return new DiscardFromDeckEffect(params);
                case EFFECT_DISCARD_DRAW:
                    return new DiscardDrawEffect(params);
                case EFFECT_DISCARD_GAME:
                    return new DiscardFromGameEffect(params);
                case EFFECT_DISCARD_HAND:
                    return new DiscardFromHandEffect(params);
                case EFFECT_DISCARD_CONDITION_HAND:
                    return new DiscardConditionHandEffect(params);
                case EFFECT_DISCARD_RANDOM:
                    return new DiscardRandomEffect(params);
                case EFFECT_DISCARD_REVEAL:
                    return new DiscardRevealEffect(params);
                case EFFECT_DO_IF:
                    return new DoIfEffect(params);
                case EFFECT_DO_IF_CARD_GAME:
                    return new DoIfCardGameEffect(params);
                case EFFECT_DO_IF_HAS_DAMAGE:
                    return new DoIfHasDamageEffect(params);
                case EFFECT_DO_IF_HAS_PAID:
                    return new DoIfHasPaidEffect(params);
                case EFFECT_DO_IF_HAS_TRAITS:
                    return new DoIfHasTraitsEffect(params);
                case EFFECT_DO_IF_TAKE_DAMAGE:
                    return new DoIfTakeCharacterDamageEffect(params);
                case EFFECT_DRAW_CARD:
                    return new DrawEffect(params);
                case EFFECT_ENEMY_ATTACK:
                    return new EnemyAttackEffect(params);
                case EFFECT_EXHAUST:
                    return new ExhaustEffect(params);
                case EFFECT_FACEDOWN:
                    return new FaceDownEffect(params);
                case EFFECT_FLIP:
                    return new FlipEffect(params);
                case EFFECT_HEAL:
                    return new HealEffect(params);
                case EFFECT_INCLUDE_ASIDE_CARDS:
                    return new IncludeAsideCardsEffect(params);
                case EFFECT_DELAYED:
                    return new DelayedEffect(params);
                case EFFECT_LASTING:
                    return new LastingEffect(params);
                case EFFECT_MAY:
                    return new MayEffect(params);
                case EFFECT_MODIFY_ATTACK:
                    return new ModifyAttackEffect(params);
                case EFFECT_MODIFY_ATTACK_VALUE:
                    return new ModifyAttackValueEffect(params);
                case EFFECT_MODIFY_COST:
                    return new ModifyCostEffect(params);
                case EFFECT_MODIFY_DEFENSE_VALUE:
                    return new ModifyDefenseValueEffect(params);
                case EFFECT_MODIFY_THWART_VALUE:
                    return new ModifyThwartValueEffect(params);
                case EFFECT_MODIFY_TRAITS:
                    return new ModifyTraitsEffect(params);
                case EFFECT_PLACE_COUNTER:
                    return new PlaceCountersEffect(params);
                case EFFECT_PLACE_DAMAGE:
                    return new PlaceDamageEffect(params);
                case EFFECT_PLACE_THREAT:
                    return new PlaceThreatEffect(params);
                case EFFECT_RANDOM_CARD:
                    return new RandomCardEffect(params);
                case EFFECT_READY:
                    return new ReadyEffect(params);
                case EFFECT_REMOVE_CARD:
                    return new RemoveCardEffect(params);
                case EFFECT_REMOVE_THREAT:
                    return new RemoveThreatEffect(params);
                case EFFECT_REMOVE_USE:
                    return new RemoveCountersEffect(params);
                case EFFECT_RETURN_FACEDOWN:
                    return new ReturnFaceDownEffect(params);
                case EFFECT_REVEAL_FIRST_ENCOUNTER:
                    return new RevealFirstEncounterEffect(params);
                case EFFECT_ENEMY_SCHEME:
                    return new EnemySchemeEffect(params);
                case EFFECT_SEARCH_CARD_REVEAL:
                    return new SearchCardAndRevealEffect(params);
                case EFFECT_SELECT_DISCARD_CARD:
                    return new SelectDiscardCardEffect(params);
                case EFFECT_SEVERAL_ATTACKS:
                    return new SeveralAttacksEffect(params);
                case EFFECT_SPEND:
                    return new SpendEffect(params);
                case EFFECT_SPEND_X:
                    return new SpendXEffect(params);
                case EFFECT_SURGE:
                    return new SurgeEffect(params);
                case EFFECT_STUN:
                    return new StunEffect(params);
                case EFFECT_TAKE_DAMAGE:
                    return new TakeDamageEffect(params);
                case EFFECT_TOUGH:
                    return new ToughEffect(params);
            }
        }
    }
    _parseChained(params) {
        const {effects} = params;

        return {
            ...params,
            effects: effects.map(this.parseEffect.bind(this)),
        }
    }
    _parseChoose(params) {
        const {options} = params;

        return {
            ...params,
            options: options.map(this.parseEffect.bind(this)),
        }
    }
    _parseChooseAbility(params) {
        const {options} = params;

        return {
            ...params,
            options: options.map(option => this.abilitiesFactory.createAbility(option))
        }
    }
    _parseDelayed(params) {
        const {effect} = params;

        return {
            ...params,
            effect: this.parseEffect(effect),
        }
    }
    _parseDoIf(params) {
        const {effect, effectNot} = params;

        return {
            ...params,
            effect: this.parseEffect(effect),
            effectNot: this.parseEffect(effectNot),
        }
    }
    parseEffect({type, params = {}} = {}) {
        if (params) {
            if (params.thenEffect) {
                params.thenEffect = this.parseEffect(params.thenEffect);
            }

            switch (type) {
                case EFFECT_CHAINED:
                    return this.createEffect({
                        type,
                        params: this._parseChained(params)
                    });
                case EFFECT_CHOOSE:
                    return this.createEffect({
                        type,
                        params: this._parseChoose(params)
                    });
                case EFFECT_CHOOSE_ABILITY:
                    return this.createEffect({
                        type,
                        params: this._parseChooseAbility(params)
                    });
                case EFFECT_MAY:
                    return this.createEffect({
                        type,
                        params: this._parseMay(params)
                    });
                case EFFECT_DO_IF:
                case EFFECT_DO_IF_CARD_GAME:
                case EFFECT_DO_IF_HAS_DAMAGE:
                case EFFECT_DO_IF_HAS_PAID:
                case EFFECT_DO_IF_HAS_TRAITS:
                case EFFECT_DO_IF_TAKE_DAMAGE:
                    return this.createEffect({
                        type,
                        params: this._parseDoIf(params),
                    });
                case EFFECT_DELAYED:
                    return this.createEffect({
                        type,
                        params: this._parseDelayed(params),
                    });
                case EFFECT_LASTING:
                    return this.createEffect({
                        type,
                        params: this._parseLasting(params),
                    });
                default:
                    return this.createEffect({
                        type,
                        params,
                    });
            }
        }
    }
    _parseLasting(params) {
        const {effect} = params;

        return {
            ...params,
            effect: this.parseEffect(effect),
        }
    }
    _parseMay(params) {
        const {effect} = params;

        return {
            ...params,
            effect: this.parseEffect(effect)
        }
    }
}
