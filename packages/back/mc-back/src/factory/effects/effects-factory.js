import {EFFECT_MAP} from './effects-map.js';
import {EFFECT_PARSERS_MAP} from './effects-parsers.js';
import {findPrePlayConfirmationEffect} from '../../utils/pre-play-confirmation.js';

export class EffectsFactory {
    constructor(abilitiesFactory) {
        this.abilitiesFactory = abilitiesFactory;
    }
    get match() {
        return this.abilitiesFactory.match;
    }
    createEffect(par = {}) {
        if (par instanceof Array) {
            return par.map(p => this.createEffect(p));
        }

        const {type, params, ...rest} = par;
        const effectParams = params ? {...params, ...rest} : rest;

        effectParams.match = this.match;
        effectParams.refreshTarget = true;

        const EffectClass = EFFECT_MAP[type];
        if (EffectClass) {
            return new EffectClass({
                ...effectParams,
                effectType: type,
            });
        }
    }
    _parseEffectGroup(params) {
        const {effects = [], prePlayConfirmation, ...groupParams} = params;
        const parsedEffects = effects.map(this.parseEffect.bind(this));
        const effectGroup = {
            ...groupParams,
            effects: parsedEffects,
        };

        if (prePlayConfirmation !== undefined) {
            const confirmationEffect =
                findPrePlayConfirmationEffect(effectGroup);
            if (!confirmationEffect) {
                throw new TypeError(
                    'The effect group has no effect that supports pre-play confirmation.'
                );
            }

            confirmationEffect.prePlayConfirmation = {
                ...prePlayConfirmation,
                ...confirmationEffect.prePlayConfirmation,
            };
        }

        return effectGroup;
    }
    _parseAdditionalCost(params) {
        const {cost, ...rest} = params;

        return {
            ...rest,
            cost: this.parseEffect(cost),
        };
    }
    _parseChoose(params) {
        const {options = []} = params;

        return {
            ...params,
            options: options.map(this.parseEffect.bind(this)),
        };
    }
    _parseChooseAbility(params) {
        const {options = []} = params;

        return {
            ...params,
            options: options.map(option => this.abilitiesFactory.createAbility(option))
        };
    }
    _parseDelayed(params) {
        const {effect} = params;

        return {
            ...params,
            effect: effect ? this.parseEffect(effect) : undefined,
        };
    }
    _parseForEach(params) {
        const {effect, ...rest} = params;

        return {
            ...rest,
            effectDefinition: effect,
        };
    }
    _parseReplaceEffect(params) {
        const {replacement, ...rest} = params;

        return {
            ...rest,
            replacement: replacement ? this.parseEffect(replacement) : undefined,
        };
    }
    _parseDoIf(params) {
        const {effect, effectNot} = params;

        return {
            ...params,
            effect: effect ? this.parseEffect(effect) : undefined,
            effectNot: effectNot ? this.parseEffect(effectNot) : undefined,
        };
    }
    parseEffect(par = {}) {
        if (!par || Object.keys(par).length === 0) {
            return undefined;
        }

        if (par instanceof Array) {
            return par.map(p => this.parseEffect(p));
        }

        const {type, params: rawParams} = par;

        if (rawParams) {
            const params = {...rawParams};

            if (params.thenEffect) {
                params.thenEffect = this.parseEffect(params.thenEffect);
            }

            const parserMethod = EFFECT_PARSERS_MAP[type];
            const effectParams = parserMethod ? this[parserMethod](params) : params;

            return this.createEffect({
                type,
                params: effectParams,
            });
        }

        const {type: typePar, ...paramsPar} = par;
        return this.createEffect({
            type: typePar,
            params: paramsPar,
        });
    }
    _parseLasting(params) {
        const {effect, endEffect} = params;

        return {
            ...params,
            effect: effect ? this.parseEffect(effect) : undefined,
            endEffect: endEffect ? this.parseEffect(endEffect) : undefined,
        };
    }
    _parseMay(params) {
        const {effect} = params;

        return {
            ...params,
            effect: effect ? this.parseEffect(effect) : undefined
        };
    }
}
