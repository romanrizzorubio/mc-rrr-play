import {
    ASPECT_NAMES,
    CLASSIFICATION_BASIC,
    CLASSIFICATION_HERO,
    getClassifications,
    getSelectedDeckAspects,
    hasClassification,
    translateAspect,
    translateClassification,
} from 'mc-shared';

export {ASPECT_NAMES};

const CARD_TYPE_NAMES = {
    ally: 'Aliado',
    attachment: 'Accesorio',
    event: 'Evento',
    resource: 'Recurso',
    support: 'Apoyo',
    upgrade: 'Mejora',
};

const RESOURCE_NAMES = {
    e: 'Energía',
    m: 'Mental',
    p: 'Físico',
    w: 'Universal',
};

const ASPECT_BACKGROUND_COLORS = {
    aggression: 'var(--deck-aspect-aggression-color)',
    justice: 'var(--deck-aspect-justice-color)',
    protection: 'var(--deck-aspect-protection-color)',
    leadership: 'var(--deck-aspect-leadership-color)',
    pool: 'var(--deck-aspect-pool-color)',
};

export function getAspectName(aspect) {
    return translateAspect(aspect);
}

export function getDeckAspectName(deck) {
    return getSelectedDeckAspects(deck)
        .map(getAspectName)
        .join(', ');
}

export function getDeckAspectClass(deck) {
    const [aspect] = getSelectedDeckAspects(deck);

    return getAspectClass(aspect);
}

export function getDeckAspectGradient(deck) {
    const colors = getSelectedDeckAspects(deck)
        .map(aspect => Object.hasOwn(ASPECT_BACKGROUND_COLORS, aspect) ?
            ASPECT_BACKGROUND_COLORS[aspect] : '')
        .filter(Boolean);

    return colors.length > 1 ?
        `linear-gradient(90deg, ${colors.join(', ')})` :
        '';
}

export function matchesDeckAspectFilter(card, filter, deckAspects) {
    const isBasicCard = hasClassification(
        card.classification,
        CLASSIFICATION_BASIC,
    );

    if (filter === 'all') {
        return true;
    }
    if (filter === 'basic') {
        return isBasicCard;
    }
    if (isBasicCard) {
        return false;
    }

    return filter === 'deck' ?
        deckAspects.includes(card.aspect) :
        deckAspects.includes(filter) && card.aspect === filter;
}

export function getAspectClass(aspect) {
    return Object.hasOwn(ASPECT_NAMES, aspect) ? `aspect-${aspect}` : '';
}

export function getCardCategoryClass(card) {
    if (hasClassification(card.classification, CLASSIFICATION_BASIC)) {
        return 'card-basic';
    }

    const aspect = card.aspect || getClassifications(card.classification)
        .find(classification => Object.hasOwn(ASPECT_NAMES, classification));

    return getAspectClass(aspect);
}

export function getCardTypeName(type) {
    return CARD_TYPE_NAMES[type] || type || 'Otros';
}

export function getCardOriginName(card) {
    if (card.fixed) {
        const additionalClassifications = getClassifications(card.classification)
            .filter(classification => classification !== CLASSIFICATION_HERO)
            .map(translateClassification);

        return ['Héroe', ...additionalClassifications].join(', ');
    }

    return hasClassification(card.classification, CLASSIFICATION_BASIC) ?
        translateClassification(card.classification) :
        getAspectName(card.aspect || getClassifications(card.classification)
            .find(classification => Object.hasOwn(ASPECT_NAMES, classification)));
}

export function getDeckComposition(cards, selectedAspects) {
    const aspectCounts = new Map(selectedAspects.map(aspect => [aspect, 0]));
    let basicCount = 0;
    let heroCount = 0;
    let permanentCount = 0;

    for (const card of cards) {
        const count = Number(card.count);
        if (!Number.isFinite(count) || count <= 0) {
            continue;
        }

        if (card.permanent) {
            permanentCount += count;
        } else if (card.fixed) {
            heroCount += count;
        } else if (hasClassification(card.classification, CLASSIFICATION_BASIC)) {
            basicCount += count;
        } else if (aspectCounts.has(card.aspect)) {
            aspectCounts.set(card.aspect, aspectCounts.get(card.aspect) + count);
        }
    }

    return [
        {label: 'Héroe', count: heroCount},
        {label: 'Básicas', count: basicCount},
        ...[...aspectCounts].map(([aspect, count]) => ({
            label: getAspectName(aspect),
            count,
        })),
        {label: 'Permanentes', count: permanentCount},
    ].filter(group => group.count > 0);
}

export function getResourceName(resource) {
    return RESOURCE_NAMES[resource] || resource;
}

export function getCardImageUrl(card) {
    const getAssetUrl = window.mcStaticRemote?.getAssetUrl;

    return card.image && typeof getAssetUrl === 'function' ?
        getAssetUrl(`images/cards/${card.image}`) :
        '';
}
