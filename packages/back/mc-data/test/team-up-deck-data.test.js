import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    ABILITY_HERO_INTERRUPT,
    getPlayerDeckCardCopyLimit,
    TARGET_DECK,
    TRIGGER_TREACHERY_REVEAL,
} from 'mc-shared';
import basicEvents from '../seed/catalog/aspects/basic/events.js';
import antMan from '../seed/catalog/heroes/ant-man.js';
import quicksilver from '../seed/catalog/heroes/quicksilver.js';
import {loadCatalog} from '../seed/catalog.js';
import {MongoDataStore} from '../index.js';
import {MatchFactory} from '../../mc-back/src/factory/match-factory.js';
import {Trigger} from '../../mc-back/src/triggers/base/trigger.js';

describe('Team-Up deck catalog data', () => {
    test('preserves the Team-Up names and deck maximum in the deck editor catalog', async () => {
        const teamUpCard = basicEvents.find(({_id}) =>
            _id === 'basic-tacticas-de-enjambre');
        const store = new MongoDataStore();
        store.database = {
            collection(name) {
                if (name === 'heroes') {
                    return {findOne: async () => antMan};
                }

                return {
                    find() {
                        return {
                            sort() {
                                return this;
                            },
                            toArray: async () => [teamUpCard],
                        };
                    },
                };
            },
        };

        const catalog = await store.getDeckEditorCatalog('ant-man');
        const card = catalog.cards.find(({id}) => id === teamUpCard._id);

        assert.deepEqual(card.keywords, {
            teamUp: ['Hombre Hormiga', 'Avispa'],
        });
        assert.deepEqual(card.maximum, {
            count: 1,
            target: TARGET_DECK,
        });
        assert.deepEqual(catalog.precon.find(({id}) => id === teamUpCard._id), {
            id: teamUpCard._id,
            count: 1,
        });
        assert.equal(getPlayerDeckCardCopyLimit({
            aspect: '',
            cards: [],
        }, catalog, teamUpCard._id), 1);
        assert.equal(getPlayerDeckCardCopyLimit({
            aspect: '',
            cards: [],
        }, {
            ...catalog,
            hero: {
                ...catalog.hero,
                name: 'Otro héroe',
                identities: [],
            },
        }, teamUpCard._id), 0);
    });

    test('adds Orden y caos for Mercurio and enforces its Team-Up characters in play', async () => {
        const teamUpCard = basicEvents.find(({_id}) =>
            _id === 'basic-orden-y-caos');
        const store = new MongoDataStore();
        store.database = {
            collection(name) {
                if (name === 'heroes') {
                    return {findOne: async () => quicksilver};
                }

                return {
                    find() {
                        return {
                            sort() {
                                return this;
                            },
                            toArray: async () => [teamUpCard],
                        };
                    },
                };
            },
        };

        const catalog = await store.getDeckEditorCatalog('quicksilver');
        const card = catalog.cards.find(({id}) => id === teamUpCard._id);

        assert.deepEqual(card.keywords, {
            teamUp: ['Mercurio', 'Bruja Escarlata'],
        });
        assert.deepEqual(card.maximum, {
            count: 1,
            target: TARGET_DECK,
        });
        assert.deepEqual(catalog.precon.find(({id}) => id === teamUpCard._id), {
            id: teamUpCard._id,
            count: 1,
        });
        assert.equal(getPlayerDeckCardCopyLimit({
            aspect: '',
            cards: [],
        }, catalog, teamUpCard._id), 1);
        assert.equal(getPlayerDeckCardCopyLimit({
            aspect: '',
            cards: [],
        }, {
            ...catalog,
            hero: {
                ...catalog.hero,
                name: 'Otro héroe',
                identities: [],
            },
        }, teamUpCard._id), 0);

        const {aspects} = await loadCatalog();
        const normalizedCard = aspects.find(({_id}) =>
            _id === teamUpCard._id).card;
        const match = {
            triggerCards: {},
            isUniqueCard: () => false,
            friends: [],
            enemies: [],
        };
        const cardsFactory = new MatchFactory(match).cardsFactory;
        const printedCard = cardsFactory.createCard(normalizedCard);
        const player = {
            match,
            hand: {cards: []},
            canPlayCard: async () => true,
        };
        const gameCard = cardsFactory.createGameCard({
            card: printedCard,
            owner: player,
        });
        player.hand.cards = [gameCard];
        const trigger = new Trigger({
            card: gameCard,
            ability: {
                abilityType: ABILITY_HERO_INTERRUPT,
                canTrigger: async () => true,
            },
            trigger: TRIGGER_TREACHERY_REVEAL,
        });
        const mercurio = {
            currentSide: {card: {name: 'Mercurio'}},
        };
        const scarletWitch = {
            currentSide: {card: {name: 'Bruja Escarlata', subtitle: 'Wanda Maximoff'}},
        };

        match.friends = [mercurio];
        assert.equal(await trigger.canRun({
            player,
            card: gameCard,
            effect: {},
        }), false);
        match.enemies = [scarletWitch];
        assert.equal(await trigger.canRun({
            player,
            card: gameCard,
            effect: {},
        }), false);
        match.friends = [mercurio, scarletWitch];
        assert.equal(await trigger.canRun({
            player,
            card: gameCard,
            effect: {},
        }), true);
    });
});
