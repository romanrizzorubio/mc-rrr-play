import assert from 'node:assert/strict';
import {test} from 'node:test';

import {CARD_TYPE_MAIN_SCHEME_B_CARD} from 'mc-shared';
import {GameCard} from '../../src/model/cards/game-card.js';
import {SchemeGameCard} from '../../src/model/cards/scheme-game-card.js';
import {MainSchemeBCard} from '../../src/model/printed/main-scheme-b-card.js';

test('attached threshold modifiers change and leave the scheme completion value', () => {
    const printedScheme = new MainSchemeBCard({
        name: 'Test main scheme',
        set: 'test',
        image: 'test.png',
        type: CARD_TYPE_MAIN_SCHEME_B_CARD,
        value: 10,
        startingThreat: 0,
    });
    const scheme = new SchemeGameCard({card: printedScheme});
    const attachment = {
        id: 'test-attachment',
        card: {
            threatThresholdModifier: 4,
        },
        toObj: () => ({id: 'test-attachment'}),
        toObjWithAbilityAvailability: async () => ({id: 'test-attachment'}),
    };
    const parent = {attached: [attachment]};
    scheme.parent = parent;

    assert.equal(scheme.value, 14);
    assert.equal(scheme.toObj().value, 14);

    parent.attached = [];
    assert.equal(scheme.value, 10);
});

test('main scheme serialization preserves attached cards on its active side and parent', async () => {
    const printedScheme = new MainSchemeBCard({
        name: 'Test main scheme',
        set: 'test',
        image: 'test.png',
        type: CARD_TYPE_MAIN_SCHEME_B_CARD,
        value: 10,
        startingThreat: 0,
    });
    const side = new SchemeGameCard({card: printedScheme});
    const mainScheme = new GameCard({sides: [side]});
    const parentAttachment = {
        id: 'parent-attachment',
        toObj: () => ({id: 'parent-attachment'}),
        toObjWithAbilityAvailability: async () => ({id: 'parent-attachment'}),
    };
    const sideAttachment = {
        id: 'side-attachment',
        toObj: () => ({id: 'side-attachment'}),
        toObjWithAbilityAvailability: async () => ({id: 'side-attachment'}),
    };
    mainScheme.attached.push(parentAttachment);
    side.attached.push(parentAttachment, sideAttachment);

    const serialized = await mainScheme.toObjWithAbilityAvailability({});

    assert.deepEqual(
        serialized.attached.map(card => card.id),
        ['parent-attachment', 'side-attachment']
    );
    assert.deepEqual(
        side.toObj().attached.map(card => card.id),
        ['parent-attachment', 'side-attachment']
    );
});
