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
