import {EFFECT_MAP} from './effects-map.js';
import {EFFECT_PARSERS_MAP} from './effects-parsers.js';

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
    _parseChained(params) {
        const {effects = []} = params;

        return {
            ...params,
            effects: effects.map(this.parseEffect.bind(this)),
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
        const {effect} = params;

        return {
            ...params,
            effect: effect ? this.parseEffect(effect) : undefined,
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
