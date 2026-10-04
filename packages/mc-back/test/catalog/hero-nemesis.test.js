import assert from 'node:assert/strict';
import {test} from 'node:test';

import {CARD_TYPE_MINION} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';

test('every hero catalog registers a nemesis minion', async () => {
    const {heroes} = await loadCatalog();

    for (const hero of heroes) {
        const hasNemesisMinion = hero.config.nemesis.some(({card}) =>
            card.type === CARD_TYPE_MINION && card.params.nemesis === true);

        assert.ok(hasNemesisMinion, `${hero._id} has no nemesis minion`);
    }
});
