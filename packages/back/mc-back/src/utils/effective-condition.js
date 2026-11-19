import {checkCondition, checkValue, path} from '../engine/utils.js';
import {getCardEffectiveTraits} from './has-effective-traits.js';

const isSameTraitTarget = (card, selectedTarget) => {
    if (!selectedTarget) {
        return false;
    }

    const currentSide = card.currentSide ?? card;

    return card === selectedTarget ||
        currentSide === selectedTarget ||
        card.id !== undefined && card.id === selectedTarget?.id ||
        currentSide.id !== undefined && currentSide.id === selectedTarget?.id ||
        card.parent === selectedTarget ||
        currentSide.parent === selectedTarget;
};

const getEffectiveTraitsConditionValue = async (context, conditionPath) => {
    const parts = conditionPath.split('.');
    const traitsIndex = parts.lastIndexOf('traits');
    if (traitsIndex === -1) {
        return undefined;
    }

    const cardPath = parts.slice(0, traitsIndex).join('.');
    const traitsPath = parts.slice(traitsIndex + 1).join('.');
    const target = cardPath ? path(context, cardPath) : context;
    const cards = (Array.isArray(target) ? target.flat(Infinity) : [target])
        .filter(Boolean);
    const hasEffectiveTraits = cards.some(card =>
        typeof (card.currentSide ?? card).getEffectiveTraits === 'function');
    if (!hasEffectiveTraits) {
        return undefined;
    }

    const player = path(context, 'player');
    const traitCalculation = context.effect?.isTraitsCalculation ?
        context.effect :
        undefined;
    const values = await Promise.all(cards.map(async card => {
        if (traitCalculation &&
            isSameTraitTarget(card, traitCalculation.selectedTarget)) {
            // Avoid recursively recalculating the traits currently being resolved.
            const target = card.currentSide ?? card;
            const traits = target.traits ?? card.traits ?? [];

            const effectiveTraits = [
                ...traits,
                ...traitCalculation.modifyTraits,
            ];

            return traitsPath ?
                path(effectiveTraits, traitsPath) :
                effectiveTraits;
        }

        const traits = await getCardEffectiveTraits(card, player) ?? [];

        return traitsPath ? path(traits, traitsPath) : traits;
    }));

    return values.flat(Infinity);
};

const checkArrayCondition = async (items, condition) => {
    const [operator] = Object.keys(condition);
    if (operator === 'every') {
        for (const item of items) {
            if (!await checkConditionWithEffectiveTraits(item, condition.every)) {
                return false;
            }
        }

        return true;
    }

    if (operator === 'some') {
        for (const item of items) {
            if (await checkConditionWithEffectiveTraits(item, condition.some)) {
                return true;
            }
        }

        return false;
    }
};

export const checkConditionWithEffectiveTraits = async (context, condition) => {
    if (Array.isArray(condition)) {
        for (const alternative of condition) {
            if (await checkConditionWithEffectiveTraits(context, alternative)) {
                return true;
            }
        }

        return false;
    }

    for (const [conditionPath, expectedValue] of Object.entries(condition)) {
        if (conditionPath === 'not') {
            if (await checkConditionWithEffectiveTraits(context, expectedValue)) {
                return false;
            }

            continue;
        }

        const effectiveTraits = await getEffectiveTraitsConditionValue(
            context,
            conditionPath,
        );
        const actualValue = effectiveTraits === undefined ?
            path(context, conditionPath) :
            effectiveTraits;

        if (Array.isArray(actualValue) &&
            expectedValue &&
            typeof expectedValue === 'object' &&
            !Array.isArray(expectedValue) &&
            Object.keys(expectedValue).length === 1 &&
            (Object.hasOwn(expectedValue, 'every') ||
                Object.hasOwn(expectedValue, 'some'))) {
            if (!await checkArrayCondition(actualValue, expectedValue)) {
                return false;
            }

            continue;
        }

        if (effectiveTraits !== undefined) {
            if (!checkValue(actualValue, expectedValue)) {
                return false;
            }

            continue;
        }

        if (!checkCondition(context, {[conditionPath]: expectedValue})) {
            return false;
        }
    }

    return true;
};
