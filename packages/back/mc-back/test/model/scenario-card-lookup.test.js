import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {Scenario} from '../../src/model/match/scenario.js';
import {GameCard} from '../../src/model/cards/game-card.js';

describe('scenario card lookup', () => {
    const createCard = id => Object.assign(Object.create(GameCard.prototype), {
        id,
        attached: [],
        sides: [],
    });
    const createScenario = zones => Object.assign(Object.create(Scenario.prototype), {
        zones,
        gameZone: {cards: []},
    });

    test('returns exact attachments for villains, schemes and other cards in every zone', () => {
        const hosts = Array.from({length: 6}, (_, index) => {
            const host = createCard(`host-${index}`);
            host.attached = [createCard(`attachment-${index}`)];
            return host;
        });
        const scenario = createScenario([
            {currentVillain: hosts[0], currentScheme: hosts[1], cards: [hosts[2]]},
            {currentVillain: hosts[3], currentScheme: hosts[4], cards: [hosts[5]]},
        ]);
        for (const host of hosts) {
            assert.strictEqual(scenario.getCard(host.id), host);
            assert.strictEqual(scenario.getCard(host.attached[0].id), host.attached[0]);
        }
        assert.equal(scenario.getCard('missing'), undefined);
    });

    test('preserves current-side aliases and resolves attachments displayed on that side', () => {
        const host = createCard('villain');
        const side = createCard('villain-side');
        const attachment = createCard('side-attachment');
        side.parent = host;
        side.attached = [attachment];
        host.sides = [side];
        host.selectedSide = 0;
        const scenario = createScenario([{currentVillain: host, cards: []}]);
        assert.strictEqual(scenario.getCard(side.id), host);
        assert.strictEqual(scenario.getCard(attachment.id), attachment);
        assert.strictEqual(side.getCard(attachment.id), attachment);
        host.attached = [createCard('parent-attachment')];
        assert.strictEqual(side.getCard('parent-attachment'), host.attached[0]);
    });

    test('keeps lookup of legacy game-zone cards and their attachments', () => {
        const scenario = createScenario([]);
        const host = createCard('legacy-host');
        host.attached = [createCard('legacy-attachment')];
        scenario.gameZone.cards = [host];
        assert.strictEqual(scenario.getCard(host.id), host);
        assert.strictEqual(scenario.getCard('legacy-attachment'), host.attached[0]);
        assert.equal(scenario.getCard('missing'), undefined);
    });
});
