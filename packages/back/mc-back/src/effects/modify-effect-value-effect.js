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

            const value = effect[this.property] + this.count;
            const definitionEffect =
                effect.ability?.getEffectDefinition?.(effect);
            if (typeof effect.setConfigValue === 'function') {
                effect.setConfigValue(this.property, value);
                if (definitionEffect !== effect &&
                    typeof definitionEffect?.setConfigValue === 'function') {
                    definitionEffect.setConfigValue(this.property, value);
                }
            } else {
                effect[this.property] = value;
            }
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
