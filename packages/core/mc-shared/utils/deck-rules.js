import {TARGET_DECK} from '../constants/targets.js';
import {uniqueCardsShareIdentity} from './unique-card-identity.js';

export const MAX_PLAYER_DECK_SIZE = 50;
export const MAX_PLAYER_DECK_COPIES_PER_TITLE = 3;

const getPlayerDeckCardCount = card => card.permanent ? 0 : card.count;

const getDeclaredDeckMaximum = (cards, title) => cards
    .filter(card => card.name === title && card.maximum?.target === TARGET_DECK)
    .reduce((maximum, card) => Number.isInteger(card.maximum.count) &&
        card.maximum.count >= 0 ?
        Math.min(maximum, card.maximum.count) : maximum, Infinity);

export const getPlayerDeckCardCopyLimit = (deck, catalog, cardId) => {
    const {hero, cards = [], aspects = []} = catalog || {};
    const card = cards.find(item => item.id === cardId);
    const selectedAspect = deck?.aspect || '';
    const selectedAspectIsValid = !selectedAspect ||
        aspects.some(aspect => aspect.id === selectedAspect);
    const cardAspectIsAvailable = card?.aspect === 'basic' ||
        aspects.some(aspect => aspect.id === card?.aspect);
    if (!hero || !card || !selectedAspectIsValid || !cardAspectIsAvailable ||
        (selectedAspect && card.aspect !== 'basic' && card.aspect !== selectedAspect)) {
        return 0;
    }

    const cardsById = new Map(cards.map(item => [item.id, item]));
    const otherCards = (deck?.cards || [])
        .filter(entry => entry.id !== cardId)
        .map(entry => ({entry, card: cardsById.get(entry.id)}))
        .filter(item => item.card);
    const otherCopiesByTitle = otherCards.reduce((copies, {entry, card: otherCard}) =>
        copies + (otherCard.name === card.name ? entry.count : 0), 0);
    const declaredDeckMaximum = getDeclaredDeckMaximum(cards, card.name);
    const otherNonUniqueCopiesByTitle = otherCards.reduce((copies, {entry, card: otherCard}) => {
        if (!otherCard.unique && otherCard.name === card.name) {
            copies += entry.count;
        }
        return copies;
    }, 0);
    let copyLimit = card.unique ? 1 : MAX_PLAYER_DECK_COPIES_PER_TITLE -
        otherNonUniqueCopiesByTitle;
    if (Number.isFinite(declaredDeckMaximum)) {
        copyLimit = Math.min(
            copyLimit,
            declaredDeckMaximum - otherCopiesByTitle,
        );
    }

    if (card.unique) {
        const fixedUniqueCards = [
            ...(hero.identities || []),
            ...(hero.fixedCards || []),
        ].filter(fixedCard => fixedCard.unique);
        const selectedUniqueCards = otherCards
            .map(({card: otherCard}) => otherCard)
            .filter(otherCard => otherCard.unique);

        if ([...fixedUniqueCards, ...selectedUniqueCards].some(otherCard =>
            uniqueCardsShareIdentity(card, otherCard))) {
            return 0;
        }
    }

    const sizeWithoutCard = (hero.baseCardCount || 0) + otherCards.reduce(
        (total, {entry, card: otherCard}) =>
            total + getPlayerDeckCardCount({...otherCard, count: entry.count}),
        0,
    );
    if (!card.permanent) {
        copyLimit = Math.min(copyLimit, MAX_PLAYER_DECK_SIZE - sizeWithoutCard);
    }

    return Math.max(0, copyLimit);
};

export const validatePlayerDeck = (deck, catalog) => {
    const errors = [];
    const {hero, cards = [], aspects = []} = catalog || {};
    const selectedAspect = deck?.aspect || '';
    const availableAspects = new Set(aspects.map(({id}) => id));

    if (!hero) {
        return {
            legal: false,
            size: 0,
            errors: ['No se encontró el héroe para validar el mazo.'],
        };
    }
    if (!selectedAspect || !availableAspects.has(selectedAspect)) {
        errors.push('Elige exactamente un aspecto para el mazo.');
    }

    const cardsById = new Map(cards.map(card => [card.id, card]));
    const selectedCards = [];
    const copiesByTitle = new Map();
    const deckCopiesByTitle = new Map();
    let playerDeckCardCount = 0;

    for (const entry of deck?.cards || []) {
        const card = cardsById.get(entry.id);
        if (!card) {
            errors.push(`La carta "${entry.id}" no está disponible para este mazo.`);
            continue;
        }

        playerDeckCardCount += getPlayerDeckCardCount({
            ...card,
            count: entry.count,
        });
        selectedCards.push({card, count: entry.count});

        if (card.aspect !== 'basic' && card.aspect !== selectedAspect) {
            errors.push(
                `"${card.name}" no pertenece al aspecto seleccionado (${selectedAspect || 'ninguno'}).`
            );
        }

        if (card.unique && entry.count > 1) {
            errors.push(`No puedes incluir varias copias de la carta única "${card.name}".`);
        }
        deckCopiesByTitle.set(
            card.name,
            (deckCopiesByTitle.get(card.name) || 0) + entry.count,
        );
        if (!card.unique) {
            copiesByTitle.set(
                card.name,
                (copiesByTitle.get(card.name) || 0) + entry.count,
            );
        }
    }

    for (const [title, count] of copiesByTitle) {
        if (count > MAX_PLAYER_DECK_COPIES_PER_TITLE &&
            !Number.isFinite(getDeclaredDeckMaximum(cards, title))) {
            errors.push(
                `No puedes incluir más de ${MAX_PLAYER_DECK_COPIES_PER_TITLE} copias de "${title}".`
            );
        }
    }
    for (const [title, count] of deckCopiesByTitle) {
        const declaredDeckMaximum = getDeclaredDeckMaximum(cards, title);
        if (Number.isFinite(declaredDeckMaximum)) {
            const copyLimit = Math.min(
                MAX_PLAYER_DECK_COPIES_PER_TITLE,
                declaredDeckMaximum,
            );
            if (count > copyLimit) {
                const copyLabel = copyLimit === 1 ? 'copia' : 'copias';
                errors.push(
                    `No puedes incluir más de ${copyLimit} ${copyLabel} de "${title}" en el mazo.`
                );
            }
        }
    }

    const fixedUniqueCards = [
        ...(hero.identities || []),
        ...(hero.fixedCards || []),
    ].filter(card => card.unique);
    const selectedUniqueCards = selectedCards
        .filter(({card}) => card.unique)
        .map(({card}) => card);

    for (let index = 0; index < selectedUniqueCards.length; index++) {
        const card = selectedUniqueCards[index];

        if (fixedUniqueCards.some(fixedCard =>
            uniqueCardsShareIdentity(card, fixedCard))) {
            errors.push(`"${card.name}" coincide con una carta única fija de ${hero.name}.`);
        }
        if (selectedUniqueCards.slice(0, index).some(earlierCard =>
            uniqueCardsShareIdentity(card, earlierCard))) {
            errors.push(`"${card.name}" coincide con otra carta única del mazo.`);
        }
    }

    const size = (hero.baseCardCount || 0) + playerDeckCardCount;
    if (size < 40) {
        errors.push(`El mazo debe tener al menos 40 cartas; ahora tiene ${size}.`);
    } else if (size > MAX_PLAYER_DECK_SIZE) {
        errors.push(
            `El mazo no puede superar ${MAX_PLAYER_DECK_SIZE} cartas; ahora tiene ${size}.`
        );
    }

    return {
        legal: errors.length === 0,
        size,
        errors,
    };
};
