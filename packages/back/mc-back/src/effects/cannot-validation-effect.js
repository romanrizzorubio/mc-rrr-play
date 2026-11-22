import {checkCondition, path} from '../engine/utils.js';

import {Effect} from './effect.js';

export class CannotValidationEffect extends Effect {
    constructor({
        conditionTargetMatch,
        effectCondition,
        targetCondition,
    }) {
        super(arguments[0]);

        this.targetCondition = targetCondition;
        this.effectCondition = effectCondition;
        this.conditionTargetMatch = conditionTargetMatch;
    }
    matchesEffect() {
        return true;
    }
    isInvalidTarget(params) {
        const {effect, targetCard} = params;
        if (!effect || !targetCard || !this.matchesEffect(effect)) {
            return false;
        }

        const sourceCard = this.ability?.card;
        if (!this.targetCondition && sourceCard &&
            (sourceCard.parent ?? sourceCard) !== (targetCard.parent ?? targetCard)) {
            return false;
        }
        if (this.ability?.card?.printedTextBlank) {
            return false;
        }
        if (this.targetCondition &&
            !checkCondition(targetCard, this.targetCondition)) {
            return false;
        }

        if (this.condition) {
            const sourceZone = this.match.getScenarioZoneForCard?.(
                this.ability?.card
            );
            const zonePlayer = sourceZone?.players.find(player =>
                !player.defeated) ?? sourceZone?.players[0];
            const matchingCards = sourceZone && zonePlayer ?
                this.match.searchCards(this.condition, zonePlayer) :
                typeof this.match.searchCards === 'function' ?
                    this.match.searchCards(this.condition) :
                    [this.match.searchCard?.(this.condition)].filter(Boolean);
            if (this.conditionTargetMatch) {
                const targetValue = path(targetCard, this.conditionTargetMatch);
                if (targetValue === undefined ||
                    !matchingCards.some(card =>
                        card !== targetCard &&
                        path(card, this.conditionTargetMatch) === targetValue)) {
                    return false;
                }
            } else if (!matchingCards.length) {
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
        throw new Error(
            'CannotValidationEffect can only be used as an ability validation.'
        );
    }
}
