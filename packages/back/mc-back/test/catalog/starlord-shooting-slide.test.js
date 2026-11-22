import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {PlayerCard} from '../../src/model/printed/player-card.js';

describe('Deslizarse disparando', () => {
    test('requires a Pistola elemental in the player upgrades', async () => {
        const {heroes} = await loadCatalog();
        const starlord = heroes.find(({_id}) => _id === 'starlord');
        const cardConfig = starlord.config.cards.find(({card}) =>
            card.params.name === 'Deslizarse disparando').card;
        const card = new PlayerCard(cardConfig.params);

        assert.equal(await card.canPlay({
            player: {upgrades: [{name: 'Pistola elemental'}]},
        }), true);
        assert.equal(await card.canPlay({
            player: {upgrades: []},
        }), false);
    });
});
