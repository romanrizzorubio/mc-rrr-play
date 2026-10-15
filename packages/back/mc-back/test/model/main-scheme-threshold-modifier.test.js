import assert from 'node:assert/strict';
import {test} from 'node:test';

import {CARD_TYPE_MAIN_SCHEME_B_CARD} from 'mc-shared';
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
        card: {
            threatThresholdModifier: 4,
        },
    };
    const parent = {attached: [attachment]};
    scheme.parent = parent;

    assert.equal(scheme.value, 14);
    assert.equal(scheme.toObj().value, 14);

    parent.attached = [];
    assert.equal(scheme.value, 10);
});
