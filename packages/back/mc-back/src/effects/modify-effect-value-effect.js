import {Effect} from './effect.js';
import {checkCondition} from '../engine/utils.js';

const nestedEffectProperties = ['effect', 'effectNot', 'thenEffect', 'effects', 'options'];

export class ModifyEffectValueEffect extends Effect {
    constructor({
        count,
        abilityCondition = {},
        effectTypes,
        property,
        value,
    }) {
        super(arguments[0]);

        if (Object.hasOwn(arguments[0], 'value') &&
            (value === null || typeof value !== 'object' || Array.isArray(value))) {
            throw new TypeError(
                'ModifyEffectValueEffect value must map effect properties to values.'
            );
        }

        this.count = count;
        this.abilityCondition = abilityCondition;
        this.effectTypes = Array.isArray(effectTypes) ? effectTypes : [effectTypes];
        this.property = property;
        this.hasValue = Object.hasOwn(arguments[0], 'value');
        this.value = value;
    }
    static setConfigValue(effect, property, value) {
        const definitionEffect = effect.ability?.getEffectDefinition?.(effect);
        if (typeof effect.setConfigValue === 'function') {
            effect.setConfigValue(property, value);
            if (definitionEffect !== effect &&
                typeof definitionEffect?.setConfigValue === 'function') {
                definitionEffect.setConfigValue(property, value);
            }
        } else {
            effect[property] = value;
        }
    }
    modify(effect, ability) {
        if (Array.isArray(effect)) {
            effect.forEach(child => this.modify(child, ability));
            return;
        }
        if (!effect || typeof effect !== 'object') {
            return;
        }

        if (this.effectTypes.includes(effect.effectType) &&
            checkCondition(ability, this.abilityCondition)) {
            if (this.hasValue) {
                Object.entries(this.value).forEach(([property, value]) => {
                    ModifyEffectValueEffect.setConfigValue(effect, property, value);
                });
            } else {
                if (!Number.isFinite(effect[this.property])) {
                    throw new TypeError(
                        `Cannot modify non-numeric effect property "${this.property}".`
                    );
                }

                const value = effect[this.property] + this.count;
                ModifyEffectValueEffect.setConfigValue(
                    effect,
                    this.property,
                    value
                );
            }
        }

        nestedEffectProperties.forEach(property => this.modify(
            effect[property],
            ability
        ));
    }
    execute() {
        const abilities = this.selectedTarget?.currentSide?.abilities ??
            this.selectedTarget?.abilities;
        if (!Array.isArray(abilities)) {
            throw new TypeError('ModifyEffectValueEffect requires a played card target.');
        }

        abilities.forEach(ability => this.modify(ability.effect, ability));
    }
}
