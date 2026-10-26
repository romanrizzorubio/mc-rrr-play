import {translateTrait} from 'mc-shared';
import {
    getCardOriginName,
    getCardTypeName,
} from './deck-presentation.js';
import {compareNumbers, compareText} from './deck-sort.js';
import {getCardTraits} from './deck-card-traits.js';

export function compareDeckPoolCards(left, right, column, direction = 'asc') {
    const compareValues = {
        name: () => compareText(left.name, right.name),
        type: () => compareText(
            getCardTypeName(left.type),
            getCardTypeName(right.type),
        ),
        aspect: () => compareText(
            getCardOriginName(left),
            getCardOriginName(right),
        ),
        traits: () => compareText(
            getCardTraits(left).map(translateTrait).join(', '),
            getCardTraits(right).map(translateTrait).join(', '),
        ),
        cost: () => compareNumbers(left.cost, right.cost),
        copies: () => compareNumbers(left.maxAddCount, right.maxAddCount),
    };
    const comparison = (compareValues[column] || compareValues.name)();

    if (comparison) {
        return direction === 'desc' ? -comparison : comparison;
    }

    return compareText(left.name, right.name) ||
        compareText(left.id, right.id);
}
