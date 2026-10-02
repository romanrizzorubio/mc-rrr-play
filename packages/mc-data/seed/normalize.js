import {EFFECT_CHOOSE_ABILITY} from 'mc-shared';

const normalizeEffect = effect => {
    if (Array.isArray(effect)) {
        return effect.map(normalizeEffect);
    }
    if (!effect || typeof effect !== 'object' || typeof effect.type !== 'string') {
        throw new Error('Every game-data effect must have a string type');
    }

    const {type, params = {}, ...fields} = effect;
    if (typeof params !== 'object' || Array.isArray(params)) {
        throw new Error(`Invalid effect params for ${type}`);
    }

    const normalizedParams = {...fields, ...params};
    if (type === EFFECT_CHOOSE_ABILITY && Array.isArray(normalizedParams.options)) {
        normalizedParams.options = normalizedParams.options.map(normalizeAbility);
    }

    return {type, params: normalizedParams};
};

const normalizeAbility = ability => {
    if (!ability || typeof ability !== 'object' || typeof ability.type !== 'string') {
        throw new Error('Every game-data ability must have a string type');
    }

    const {type, params = {}, ...fields} = ability;
    if (typeof params !== 'object' || Array.isArray(params)) {
        throw new Error(`Invalid ability params for ${type}`);
    }

    const normalizedParams = {...fields, ...params};
    if (normalizedParams.arrow?.cost && !normalizedParams.arrow.type) {
        normalizedParams.arrow = normalizeEffect(normalizedParams.arrow.cost);
    } else if (normalizedParams.arrow) {
        normalizedParams.arrow = normalizeEffect(normalizedParams.arrow);
    }
    if (normalizedParams.effect) {
        normalizedParams.effect = normalizeEffect(normalizedParams.effect);
    }
    if (normalizedParams.ifNot) {
        normalizedParams.ifNot = normalizeEffect(normalizedParams.ifNot);
    }

    return {type, params: normalizedParams};
};

const normalizeCard = card => {
    if (!card || typeof card !== 'object' || typeof card.type !== 'string') {
        throw new Error('Every game-data card must have a string type');
    }

    const {type, params = {}, ...fields} = card;
    if (typeof params !== 'object' || Array.isArray(params)) {
        throw new Error(`Invalid params for ${card.name || type}`);
    }

    const normalizedParams = {...fields, ...params};
    if (normalizedParams.image === undefined && typeof normalizedParams.img === 'string') {
        normalizedParams.image = normalizedParams.img;
    }
    if (Array.isArray(normalizedParams.abilities)) {
        normalizedParams.abilities = normalizedParams.abilities.map(normalizeAbility);
    }
    delete normalizedParams.img;

    return {type, params: normalizedParams};
};

const normalizeEntries = entries => entries?.map(({card, ...entry}) => ({
    ...entry,
    card: normalizeCard(card),
}));

const normalizePrecon = entries => entries?.map(entry => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
        throw new Error('Every precon entry must be an object');
    }
    if (!Object.hasOwn(entry, 'cardRefs')) {
        return normalizeEntries([entry])[0];
    }

    const {aspect, cardRefs} = entry;
    if (typeof aspect !== 'string' || !aspect || !Array.isArray(cardRefs) || !cardRefs.length ||
        cardRefs.some(reference => !reference || typeof reference.id !== 'string' ||
            !reference.id || !Number.isInteger(reference.count) || reference.count < 1)) {
        throw new Error('Every aspect-card reference must include an aspect, ID, and positive count');
    }

    return {
        aspect,
        cardRefs: cardRefs.map(({id, count}) => ({id, count})),
    };
});

const normalizeHero = hero => ({
    ...hero,
    config: {
        ...hero.config,
        sides: hero.config.sides.map(normalizeCard),
        cards: normalizeEntries(hero.config.cards),
        precon: normalizePrecon(hero.config.precon),
        obligation: {
            ...hero.config.obligation,
            card: normalizeCard(hero.config.obligation.card),
        },
        nemesis: normalizeEntries(hero.config.nemesis),
    },
});

const normalizeScenario = scenario => ({
    ...scenario,
    config: {
        ...scenario.config,
        villains: scenario.config.villains.map(normalizeCard),
        mainSchemes: scenario.config.mainSchemes.map(side => side.map(normalizeCard)),
        cards: normalizeEntries(scenario.config.cards),
    },
});

const normalizeSet = set => ({
    ...set,
    config: {
        ...set.config,
        cards: normalizeEntries(set.config.cards),
        expertSet: normalizeEntries(set.config.expertSet),
    },
});

const normalizeAspectCard = aspectCard => {
    if (typeof aspectCard._id !== 'string' || !aspectCard._id ||
        typeof aspectCard.aspect !== 'string' || !aspectCard.aspect ||
        !Number.isInteger(aspectCard.order) || aspectCard.order < 0) {
        throw new Error('Every aspect card must have an ID, aspect, and non-negative order');
    }

    return {
        ...aspectCard,
        card: normalizeCard(aspectCard.card),
    };
};

export const normalizeCatalog = catalog => ({
    aspects: catalog.aspects.map(normalizeAspectCard),
    heroes: catalog.heroes.map(normalizeHero),
    scenarios: catalog.scenarios.map(normalizeScenario),
    sets: catalog.sets.map(normalizeSet),
});
