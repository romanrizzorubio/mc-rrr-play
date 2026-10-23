import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {BACK_CARD_PLAYER} from 'mc-shared';

globalThis.HTMLElement = class {};
globalThis.window = {
    mcStaticRemote: {
        getAssetUrl: path => path,
    },
    customElements: {
        define() {},
    },
};
globalThis.CustomEvent = class {
    constructor(type, options = {}) {
        this.type = type;
        Object.assign(this, options);
    }
};

const {HandComponent: McCardList} = await import(
    '../src/components/cards/mc-card-list/mc-card-list.js'
);

describe('Player target display', () => {
    test('shows the player name with a neutral card back', () => {
        const list = Object.assign(Object.create(McCardList.prototype), {
            size: 'm',
            marked: [],
            disabledCards: [],
            showBasicStats: false,
            showAcquiredTraits: false,
            showLife: false,
            showDamage: false,
            showThreat: false,
            showGeneric: false,
            highlightPlayable: false,
            rotatePlanCards: false,
            showExhausted: false,
        });
        const template = list.renderCard({
            id: 'player-hawkeye',
            isPlayer: true,
            name: 'Hawkeye',
        }, 0);
        const imageBinding = template.strings.findIndex(part =>
            part.includes('image='));
        const hideNameBinding = template.strings.findIndex(part =>
            part.includes('.hideName='));

        assert.equal(template.values[imageBinding], BACK_CARD_PLAYER);
        assert.equal(template.values[hideNameBinding], false);
    });
});
