import {
    EFFECT_CHAINED,
    EFFECT_SIMULTANEOUS,
} from 'mc-shared';
import {Arrow} from '../../abilities/core/arrow.js';
import {EffectsFactory} from '../effects/effects-factory.js';
import {ABILITY_MAP} from './abilities-map.js';

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
        const AbilityClass = Object.hasOwn(ABILITY_MAP, type) ?
            ABILITY_MAP[type] :
            undefined;

        if (!AbilityClass) {
            throw new Error(`Unknown ability type: ${type}`);
        }

        return new AbilityClass(params);
    }
    _createArrow(arrow) {
        arrow.isArrow = true;

        return new Arrow({
            cost: arrow,
        });
    }
    _convertCostChains(effectConfig, convertChains = true) {
        if (Array.isArray(effectConfig)) {
            return effectConfig.map(effect =>
                this._convertCostChains(effect, convertChains));
        }
        if (!effectConfig || typeof effectConfig !== 'object') {
            return effectConfig;
        }

        const converted = Object.fromEntries(
            Object.entries(effectConfig).map(([key, value]) => [
                key,
                this._convertCostChains(
                    value,
                    convertChains && key !== 'thenEffect'
                ),
            ])
        );
        if (convertChains && converted.type === EFFECT_CHAINED) {
            converted.type = EFFECT_SIMULTANEOUS;
        }

        return converted;
    }
    _parseAbility({type, params} = {}) {
        let arrow;
        if (params.arrow) {
            const arrowConfig = this._convertCostChains(params.arrow);
            arrowConfig.params = {
                ...arrowConfig.params,
                match: this.match,
            };
            arrow = this._createArrow(this.effectsFactory.parseEffect(arrowConfig));
        }

        let effect;
        if (params.effect) {
            effect = this.effectsFactory.parseEffect(params.effect);
        }
        let ifNot;
        if (params.ifNot) {
            ifNot = this.effectsFactory.parseEffect(params.ifNot);
        }
        let validation;
        if (params.validation) {
            validation = this.effectsFactory.parseEffect(params.validation);
            if (!validation) {
                throw new Error('Unable to parse ability validation.');
            }
        }

        return {
            type,
            params: {
                ...params,
                arrow,
                effect,
                ifNot,
                validation,
            }
        };
    }
}
