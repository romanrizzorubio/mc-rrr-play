import {getAspectName} from './deck-presentation.js';
import {compareNumbers, compareText} from './deck-sort.js';

export function compareDeckListItems(left, right, column, direction = 'asc') {
    const compareValues = {
        name: () => compareText(left.name, right.name),
        hero: () => compareText(left.heroName, right.heroName),
        aspect: () => compareText(
            getAspectName(left.aspect),
            getAspectName(right.aspect),
        ),
        size: () => compareNumbers(left.validation.size, right.validation.size),
    };
    const comparison = (compareValues[column] || compareValues.name)();

    if (comparison) {
        return direction === 'desc' ? -comparison : comparison;
    }

    return compareText(left.name, right.name) ||
        compareText(left.id, right.id);
}
