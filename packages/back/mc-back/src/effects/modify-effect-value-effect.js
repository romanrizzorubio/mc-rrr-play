import {Effect} from './effect.js';

const nestedEffectProperties = ['effect', 'effectNot', 'thenEffect', 'effects', 'options'];

export class ModifyEffectValueEffect extends Effect {
    constructor({
        count,
        effectTypes,
        property,
    }) {
        super(arguments[0]);

        this.count = count;
        this.effectTypes = Array.isArray(effectTypes) ? effectTypes : [effectTypes];
        this.property = property;
    }
    modify(effect) {
        if (Array.isArray(effect)) {
            effect.forEach(child => this.modify(child));
            return;
        }
        if (!effect || typeof effect !== 'object') {
            return;
        }

        if (this.effectTypes.includes(effect.effectType)) {
            if (!Number.isFinite(effect[this.property])) {
                throw new TypeError(
                    `Cannot modify non-numeric effect property "${this.property}".`
                );
            }

            effect[this.property] += this.count;
        }

        nestedEffectProperties.forEach(property => this.modify(effect[property]));
    }
    execute() {
        const abilities = this.selectedTarget?.abilities;
        if (!Array.isArray(abilities)) {
            throw new TypeError('ModifyEffectValueEffect requires a played card target.');
        }

        abilities.forEach(ability => this.modify(ability.effect));
    }
}
