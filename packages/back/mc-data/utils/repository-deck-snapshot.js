import {randomUUID} from 'node:crypto';
import {rename, rm, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

export const REPOSITORY_DECK_SNAPSHOT_VERSION = 1;
export const REPOSITORY_DECK_SNAPSHOT_PATH = fileURLToPath(
    new URL('../seed/catalog/decks.json', import.meta.url),
);

const invalidSnapshotError = message =>
    new Error(`El snapshot de mazos del repositorio no es válido: ${message}`);

const isTimestamp = value =>
    typeof value === 'string' && Number.isFinite(Date.parse(value));

const sortById = (left, right) =>
    left.id < right.id ? -1 : left.id > right.id ? 1 : 0;

const validateDecks = decks => {
    if (!Array.isArray(decks)) {
        throw invalidSnapshotError('la propiedad "decks" debe ser una lista.');
    }

    const ids = new Set();
    for (const [index, deck] of decks.entries()) {
        if (!deck || typeof deck !== 'object' || Array.isArray(deck) ||
            typeof deck.id !== 'string' || !deck.id ||
            typeof deck.name !== 'string' || !deck.name.trim() ||
            typeof deck.heroId !== 'string' || !deck.heroId ||
            (typeof deck.aspect !== 'string' &&
                (!Array.isArray(deck.aspect) ||
                    deck.aspect.some(aspect => typeof aspect !== 'string'))) ||
            (deck.aspects !== undefined &&
                (!Array.isArray(deck.aspects) ||
                    deck.aspects.some(aspect => typeof aspect !== 'string'))) ||
            !Array.isArray(deck.cards) ||
            !isTimestamp(deck.createdAt) ||
            !isTimestamp(deck.updatedAt)) {
            throw invalidSnapshotError(`el mazo de la posición ${index} está incompleto.`);
        }
        if (ids.has(deck.id)) {
            throw invalidSnapshotError(`el ID "${deck.id}" aparece más de una vez.`);
        }
        ids.add(deck.id);
        if (deck.cards.some(card =>
            !card || typeof card.id !== 'string' || !card.id ||
            !Number.isInteger(card.count) || card.count < 1 || card.count > 99)) {
            throw invalidSnapshotError(`las cartas del mazo "${deck.id}" no son válidas.`);
        }
    }

    return decks.map(deck => {
        const {aspects: legacyAspects, ...fields} = deck;

        return {
            ...fields,
            aspect: Array.isArray(fields.aspect) ?
                fields.aspect :
                Array.isArray(legacyAspects) ? legacyAspects : fields.aspect,
        };
    });
};

const validateDeletions = (deletions, deckIds) => {
    if (!Array.isArray(deletions)) {
        throw invalidSnapshotError('la propiedad "deletions" debe ser una lista.');
    }

    const ids = new Set(deckIds);
    for (const [index, deletion] of deletions.entries()) {
        if (!deletion || typeof deletion !== 'object' || Array.isArray(deletion) ||
            typeof deletion.id !== 'string' || !deletion.id ||
            !isTimestamp(deletion.deletedAt)) {
            throw invalidSnapshotError(
                `el borrado de la posición ${index} está incompleto.`,
            );
        }
        if (ids.has(deletion.id)) {
            throw invalidSnapshotError(
                `el ID "${deletion.id}" aparece como mazo y borrado.`,
            );
        }
        ids.add(deletion.id);
    }

    return deletions;
};

const validateSnapshot = snapshot => {
    const decks = validateDecks(snapshot.decks);
    const deletions = validateDeletions(
        snapshot.deletions ?? [],
        decks.map(deck => deck.id),
    );

    return {decks, deletions};
};

const eventsById = snapshot => {
    const events = new Map();
    for (const deck of snapshot.decks) {
        events.set(deck.id, {
            id: deck.id,
            type: 'deck',
            timestamp: Date.parse(deck.updatedAt),
            value: deck,
        });
    }
    for (const deletion of snapshot.deletions) {
        events.set(deletion.id, {
            id: deletion.id,
            type: 'deletion',
            timestamp: Date.parse(deletion.deletedAt),
            value: deletion,
        });
    }

    return events;
};

const compareEvents = (left, right) => {
    if (left.timestamp !== right.timestamp) {
        return left.timestamp - right.timestamp;
    }
    if (left.type !== right.type) {
        return left.type === 'deletion' ? 1 : -1;
    }

    return 0;
};

const snapshotFromEvents = events => {
    const decks = [];
    const deletions = [];
    for (const event of events.values()) {
        if (event.type === 'deck') {
            decks.push(event.value);
        } else {
            deletions.push(event.value);
        }
    }

    return {
        decks: decks.sort(sortById),
        deletions: deletions.sort(sortById),
    };
};

export function parseRepositoryDeckSnapshot(contents) {
    let snapshot;
    try {
        snapshot = JSON.parse(contents);
    } catch (error) {
        throw new Error('No se pudo leer el JSON del snapshot de mazos.', {cause: error});
    }

    if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot) ||
        snapshot.version !== REPOSITORY_DECK_SNAPSHOT_VERSION) {
        throw invalidSnapshotError('la versión del formato no es compatible.');
    }

    return validateSnapshot(snapshot);
}

export function serializeRepositoryDeckSnapshot(snapshot) {
    const {decks, deletions} = validateSnapshot(snapshot);
    const normalizedDecks = decks
        .map(({id, name, heroId, aspect, cards, createdAt, updatedAt}) => ({
            id,
            name,
            heroId,
            aspect,
            cards: cards.map(({id: cardId, count}) => ({id: cardId, count})),
            createdAt,
            updatedAt,
        }))
        .sort(sortById);
    const normalizedDeletions = deletions
        .map(({id, deletedAt}) => ({id, deletedAt}))
        .sort(sortById);

    return `${JSON.stringify({
        version: REPOSITORY_DECK_SNAPSHOT_VERSION,
        decks: normalizedDecks,
        deletions: normalizedDeletions,
    }, null, 2)}\n`;
}

export async function writeRepositoryDeckSnapshot(
    snapshot,
    snapshotPath = REPOSITORY_DECK_SNAPSHOT_PATH,
) {
    const contents = serializeRepositoryDeckSnapshot(snapshot);
    const temporaryPath = `${snapshotPath}.${randomUUID()}.tmp`;

    try {
        await writeFile(temporaryPath, contents, {encoding: 'utf8', flag: 'wx'});
        await rename(temporaryPath, snapshotPath);
    } finally {
        await rm(temporaryPath, {force: true});
    }
}

export function mergeDecksByUpdatedAt(repositoryDecks, localDecks) {
    const decksById = new Map(repositoryDecks.map(deck => [deck.id, deck]));

    for (const localDeck of localDecks) {
        const repositoryDeck = decksById.get(localDeck.id);
        if (!repositoryDeck ||
            Date.parse(localDeck.updatedAt) > Date.parse(repositoryDeck.updatedAt)) {
            decksById.set(localDeck.id, localDeck);
        }
    }

    return [...decksById.values()].sort(sortById);
}

export function mergeDeckSnapshots(repositorySnapshot, localSnapshot) {
    const events = eventsById(validateSnapshot(repositorySnapshot));

    for (const [id, event] of eventsById(validateSnapshot(localSnapshot))) {
        const repositoryEvent = events.get(id);
        if (!repositoryEvent || compareEvents(event, repositoryEvent) > 0) {
            events.set(id, event);
        }
    }

    return snapshotFromEvents(events);
}

export function newerRepositoryDeckEvents(repositorySnapshot, localSnapshot) {
    const localEvents = eventsById(validateSnapshot(localSnapshot));

    return [...eventsById(validateSnapshot(repositorySnapshot)).values()]
        .filter(repositoryEvent => {
            const localEvent = localEvents.get(repositoryEvent.id);

            return !localEvent || compareEvents(repositoryEvent, localEvent) > 0;
        });
}

export function isDeckNewer(candidate, current) {
    return Date.parse(candidate.updatedAt) > Date.parse(current.updatedAt);
}
