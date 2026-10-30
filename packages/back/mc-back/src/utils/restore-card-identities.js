import {Effect} from '../effects/effect.js';
import {GameCard} from '../model/cards/game-card.js';
import {Match} from '../model/match/match.js';

export class RestoreCardIdentities {
    static getIndex(identity, printedId) {
        const suffix = identity.id === printedId ? '' :
            identity.id?.startsWith(`${printedId}-`) ?
                identity.id.slice(printedId.length + 1) :
                '';
        const idIndex = /^\d+$/.test(suffix) ? Number(suffix) : 0;

        return Math.max(Number.isSafeInteger(identity.index) ? identity.index : 0, idIndex);
    }
    static recordIndex(ledger, key, index) {
        ledger.set(key, Math.max(ledger.get(key) || 0, index));
    }
    static getSidesKey(card) {
        return card.sides.map(side =>
            `${side.card.type}:${side.card.name}:${side.card.stage ?? ''}`
        ).join('--');
    }
    static restore(objects) {
        const cards = objects.filter(object => object instanceof GameCard);
        objects.filter(object => object instanceof Match).forEach(match => {
            const matchCards = cards.filter(card => card.match === match);
            RestoreCardIdentities.restoreMatch(match, matchCards, objects);
        });
    }
    static restoreMatch(match, cards, objects) {
        const ledger = match.copyIndexesByCardId ??= new Map();
        if (!(ledger instanceof Map)) {
            throw new Error('Cannot restore the match card-copy ledger.');
        }

        const oldIds = new Map(cards.map(card => [card, card.id]));
        const identities = cards.filter(card => !card.sides.length);
        cards.forEach(card => {
            if (card.facedownConversion && !card.facedownConversion.sides.length) {
                identities.push(card.facedownConversion);
            }
        });
        const reserved = new Set([
            ...cards.map(card => card.id),
            ...identities.map(identity => identity.id),
        ]);
        identities.forEach(identity => {
            RestoreCardIdentities.recordIndex(
                ledger,
                identity.card.id,
                RestoreCardIdentities.getIndex(identity, identity.card.id)
            );
        });
        cards.filter(card => card.sides.length).forEach(card => {
            RestoreCardIdentities.recordIndex(
                ledger,
                RestoreCardIdentities.getSidesKey(card),
                Math.max(card.index || 0, ...card.sides.map(side =>
                    RestoreCardIdentities.getIndex(side, side.card.id)))
            );
        });

        const used = new Set();
        identities.forEach(identity => {
            if (used.has(identity.id)) {
                const printedId = identity.card.id;
                let index = ledger.get(printedId) || 0;
                let id;
                do {
                    index++;
                    id = `${printedId}-${index}`;
                } while (reserved.has(id));
                identity.id = id;
                identity.index = index;
                reserved.add(id);
                RestoreCardIdentities.recordIndex(ledger, printedId, index);
            }
            used.add(identity.id);
        });

        const restored = new Set();
        const pending = new Set();
        const restoreSides = card => {
            if (restored.has(card)) {
                return;
            }
            if (pending.has(card)) {
                throw new Error('Cannot restore cyclic card sides.');
            }
            pending.add(card);
            card.sides.forEach(side => {
                if (side.parent !== card) {
                    throw new Error('Cannot restore card sides with an ambiguous parent.');
                }
                restoreSides(side);
            });
            if (card.sides.length) {
                if (card.sides.some(side => side.id !== oldIds.get(side))) {
                    card.id = card.sides.reduce((id, side) => `${id}--${side.id}`, '');
                    card.index = Math.max(card.index || 0, ...card.sides.map(side =>
                        RestoreCardIdentities.getIndex(side, side.card.id)));
                }
                if (used.has(card.id)) {
                    throw new Error(`Cannot restore duplicate multi-sided card "${card.id}".`);
                }
                used.add(card.id);
                RestoreCardIdentities.recordIndex(
                    ledger,
                    RestoreCardIdentities.getSidesKey(card),
                    card.index || 0
                );
            }
            pending.delete(card);
            restored.add(card);
        };
        cards.forEach(restoreSides);

        const cardsByOldId = new Map();
        cards.forEach(card => {
            const oldId = oldIds.get(card);
            const copies = cardsByOldId.get(oldId) || [];
            copies.push(card);
            cardsByOldId.set(oldId, copies);
            if (Object.hasOwn(card, 'parentId') && card.parent) {
                card.parentId = card.parent.id;
            }
        });
        objects.filter(object => object instanceof Effect && object.match === match)
            .forEach(effect => {
                const targets = Array.isArray(effect.selectedTarget) ?
                    effect.selectedTarget :
                    [effect.selectedTarget];
                targets.forEach(target => {
                    if (!target || target instanceof GameCard) {
                        return;
                    }
                    ['id', 'parentId'].forEach(property => {
                        const copies = cardsByOldId.get(target[property]);
                        if (!copies?.some(card => card.id !== oldIds.get(card))) {
                            return;
                        }
                        if (copies.length !== 1) {
                            throw new Error(
                                `Cannot restore ambiguous selected target "${target[property]}".`
                            );
                        }
                        target[property] = copies[0].id;
                    });
                });
            });

        RestoreCardIdentities.restoreTriggers(match, cards, objects);
    }
    static restoreTriggers(match, cards, objects) {
        const registeredEntries = Object.entries(match.triggerCards || {});
        const registered = new Set(registeredEntries.map(([, source]) => source));
        const discarded = new Set(objects.flatMap(object =>
            Array.isArray(object.discardPile) ? object.discardPile : []));
        const triggerCards = {};
        cards.forEach(card => {
            const triggers = Object.values(card.triggers).flatMap(priorities =>
                Object.values(priorities).flat());
            if (!triggers.length) {
                return;
            }
            const isInHand = (match.players || []).some(player =>
                player.hand?.cards?.includes(card));
            const persistent = triggers.some(trigger =>
                trigger.ability?.lasting || trigger.keepTriggering);
            if (discarded.has(card) && !card.isPlaying && !persistent) {
                return;
            }
            const inPlay = card.isPlaying ||
                match.inPlayCards?.includes(card) ||
                (match.players || []).some(player =>
                    player.superhero === card ||
                    player.gameZone?.cards?.includes(card) ||
                    player.superhero?.sides?.includes(card));
            const eligible = card.isEvent ?
                isInHand || card.isPlaying || persistent :
                registered.has(card) || inPlay || persistent ||
                    (isInHand && triggers.some(trigger => trigger.ability?.workInHand));
            if (eligible) {
                triggerCards[card.id] = card;
            }
        });
        // Scenario and match engines can also register triggers without being cards.
        registeredEntries.forEach(([key, source]) => {
            if (!(source instanceof GameCard) && source) {
                const id = source.id ?? key;
                if (Object.hasOwn(triggerCards, id)) {
                    throw new Error(`Cannot restore duplicate trigger source "${id}".`);
                }
                triggerCards[id] = source;
            }
        });
        match.triggerCards = triggerCards;
    }
}
