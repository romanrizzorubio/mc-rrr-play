import {ASPECT_NAMES, getSelectedDeckAspects} from 'mc-shared';

export const getDeckCardCount = deck => {
    if (Number.isInteger(deck.validation?.size)) {
        return deck.validation.size;
    }

    return '—';
};

export const getDeckAspectClass = deck => {
    const [aspect] = getSelectedDeckAspects(deck);

    return Object.hasOwn(ASPECT_NAMES, aspect) ? `aspect-${aspect}` : '';
};

export const getAspectColorClass = aspect =>
    Object.hasOwn(ASPECT_NAMES, aspect) ? `aspect-${aspect}` : '';

export const getDeckAspectGradient = deck => {
    const aspects = getSelectedDeckAspects(deck)
        .filter(aspect => Object.hasOwn(ASPECT_NAMES, aspect));
    if (aspects.length <= 1) {
        return '';
    }

    const colors = aspects.map(aspect =>
        `var(--deck-aspect-${aspect}-color)`);

    return `linear-gradient(90deg, ${colors.join(', ')})`;
};
