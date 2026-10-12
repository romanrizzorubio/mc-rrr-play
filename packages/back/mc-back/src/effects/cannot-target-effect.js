import {checkCondition, path} from '../engine/utils.js';

import {Effect} from './effect.js';

export class CannotTargetEffect extends Effect {
    constructor({
// CannotTargetEffect
        effectTypes,
        effectCategories,
        targetCondition,
        effectCondition,
        conditionTargetMatch,
    }) {
        super(arguments[0]);

        this.blockedEffectTypes = effectTypes === undefined ?
            [] :
            Array.isArray(effectTypes) ? effectTypes : [effectTypes];
        this.blockedEffectCategories = effectCategories === undefined ?
            [] :
            Array.isArray(effectCategories) ? effectCategories : [effectCategories];
        this.targetCondition = targetCondition;
        this.effectCondition = effectCondition;
        this.conditionTargetMatch = conditionTargetMatch;

        if (!this.blockedEffectTypes.length && !this.blockedEffectCategories.length) {
            throw new TypeError('CannotTargetEffect requires effectTypes or effectCategories.');
        }
        if (this.blockedEffectTypes.some(type => typeof type !== 'string') ||
            this.blockedEffectCategories.some(category => typeof category !== 'string')) {
            throw new TypeError('CannotTargetEffect effectTypes and effectCategories must be strings.');
        }
    }
    isInvalidTarget(params) {
        const {effect, targetCard} = params;
        if (!effect || !targetCard) {
            return false;
        }
        if (this.ability?.card?.printedTextBlank) {
            return false;
        }

        const matchesEffectType = this.blockedEffectTypes.includes(effect.effectType);
        const matchesEffectCategory = this.blockedEffectCategories.some(category =>
            effect.effectCategories.includes(category));
        if (!matchesEffectType && !matchesEffectCategory) {
            return false;
        }
        if (this.targetCondition && !checkCondition(targetCard, this.targetCondition)) {
            return false;
        }
        if (this.condition) {
            if (this.conditionTargetMatch) {
                const targetValue = path(targetCard, this.conditionTargetMatch);
                if (targetValue === undefined ||
                    !this.match.searchCards(this.condition).some(card =>
                        card !== targetCard &&
                        path(card, this.conditionTargetMatch) === targetValue)) {
                    return false;
                }
            } else if (!this.match.searchCard(this.condition)) {
                return false;
            }
        }

        return !this.effectCondition || checkCondition({
            ...params,
            effect,
            source: effect.source ?? params.source ?? effect.ability?.card,
            targetCard,
        }, this.effectCondition);
    }
    execute() {
        throw new Error('CannotTargetEffect can only be used as an ability validation.');
    }
}
