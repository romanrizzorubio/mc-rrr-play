import assert from 'node:assert/strict';
import {stat} from 'node:fs/promises';
import {describe, test} from 'node:test';

import standard from '../../../mc-data/seed/catalog/sets/standard.js';
import {gangUp} from '../../../mc-data/seed/catalog/shared/treacheries.js';
import {MatchFactory} from '../../src/factory/match-factory.js';

describe('Standard and Expert replacement images', () => {
    const expected = new Map([
        ['Mover ficha', 'sets/standard/01186.png'],
        ['Agresión', 'sets/standard/01187.png'],
        ['Con la guardia baja', 'sets/standard/01188.png'],
        ['Todos a una', 'sets/standard/01189.png'],
        ['Una sombra del pasado', 'sets/standard/01190.png'],
        ['Agotamiento', 'sets/expert/01191.png'],
        ['Plan Maestro', 'sets/expert/01192.png'],
        ['Bajo fuego intenso', 'sets/expert/01193.png'],
    ]);
    test('every catalog and runtime card uses its corresponding replacement asset', async () => {
        const factory = new MatchFactory({});
        const entries = [...standard.config.cards, ...standard.config.expertSet];
        assert.equal(entries.length, expected.size);
        for (const {card} of entries) {
            assert.equal(card.params.image, expected.get(card.params.name));
            const runtime = factory.cardsFactory.createGameCardFromConfig(card);
            assert.equal(runtime.toObj().image, card.params.image);
            const asset = new URL(
                `../../../../front/mc-static/src/assets/images/cards/${card.params.image}`,
                import.meta.url,
            );
            assert.equal((await stat(asset)).isFile(), true);
        }
        assert.equal(gangUp.params.image, expected.get('Todos a una'));
    });
    test('keeps seven Standard cards and three Expert cards', () => {
        assert.equal(standard.config.cards.reduce((count, entry) => count + entry.count, 0), 7);
        assert.equal(standard.config.expertSet.reduce((count, entry) => count + entry.count, 0), 3);
    });
});
