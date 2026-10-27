import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {getPlayerDeckCardCopyLimit, TARGET_DECK} from 'mc-shared';
import basicEvents from '../seed/catalog/aspects/basic/events.js';
import antMan from '../seed/catalog/heroes/ant-man.js';
import {MongoDataStore} from '../index.js';

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
});
