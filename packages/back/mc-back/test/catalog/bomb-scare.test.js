import assert from 'node:assert/strict';
import {access} from 'node:fs/promises';
import {describe, test} from 'node:test';

import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import bombScare from '../../../mc-data/seed/catalog/sets/bomb-scare.js';
import {hydraTerrorist} from '../../../mc-data/seed/catalog/encounters/minions.js';

describe('Bomb Scare catalog and images', () => {
    test('Amenaza de bomba is listed as a selectable modular set', async () => {
        const {sets} = await loadCatalog();
        const set = sets.find(({_id}) => _id === 'bomb-scare');

        assert.ok(set);
        assert.equal(set.config.name, 'Amenaza de bomba');
        assert.equal(set.config.standard, false);
    });

    test('uses the new PNG artwork for every card, including the shared Hydra minion', async () => {
        const images = Object.fromEntries(bombScare.config.cards.map(({card}) => [
            card.params.name, card.params.image,
        ]));
        assert.deepEqual(images, {
            'Amenaza de bomba': 'sets/bomb-scare/01109.png',
            'Terrorista de Hydra': 'sets/bomb-scare/01110.png',
            'Explosión': 'sets/bomb-scare/01111.png',
            'Falsa Alarma': 'sets/bomb-scare/01112.png',
        });
        assert.equal(hydraTerrorist.params.image, images['Terrorista de Hydra']);
        await Promise.all(Object.values(images).map(image => access(new URL(
            `../../../../front/mc-static/src/assets/images/cards/${image}`,
            import.meta.url,
        ))));
    });
});
