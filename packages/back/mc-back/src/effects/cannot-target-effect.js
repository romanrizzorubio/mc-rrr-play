import {CannotValidationEffect} from './cannot-validation-effect.js';

export class CannotTargetEffect extends CannotValidationEffect {
    constructor({
// CannotTargetEffect
        effectTypes,
        effectCategories,
    }) {
        super(arguments[0]);

        this.blockedEffectTypes = effectTypes === undefined ?
            [] :
            Array.isArray(effectTypes) ? effectTypes : [effectTypes];
        this.blockedEffectCategories = effectCategories === undefined ?
            [] :
            Array.isArray(effectCategories) ? effectCategories : [effectCategories];

        if (!this.blockedEffectTypes.length && !this.blockedEffectCategories.length) {
            throw new TypeError('CannotTargetEffect requires effectTypes or effectCategories.');
        }
        if (this.blockedEffectTypes.some(type => typeof type !== 'string') ||
            this.blockedEffectCategories.some(category => typeof category !== 'string')) {
            throw new TypeError('CannotTargetEffect effectTypes and effectCategories must be strings.');
        }
    }
    matchesEffect(effect) {
        return this.blockedEffectTypes.includes(effect.effectType) ||
            this.blockedEffectCategories.some(category =>
                effect.effectCategories?.includes(category));
    }
    execute() {
        throw new Error('CannotTargetEffect can only be used as an ability validation.');
    }
}
