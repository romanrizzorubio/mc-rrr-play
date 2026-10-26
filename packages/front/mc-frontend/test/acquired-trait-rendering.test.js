import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {TRAIT_AERIAL} from 'mc-shared';

globalThis.HTMLElement = class {};
globalThis.window = {
    customElements: {
        define() {},
    },
    mcStaticRemote: {
        getAssetUrl(path) {
            return path;
        },
    },
};
globalThis.CustomEvent = class {
    constructor(type, options = {}) {
        this.type = type;
        Object.assign(this, options);
    }
};

const {CardComponent} = await import(
    '../src/components/cards/mc-card/mc-card.js'
);

describe('acquired trait rendering', () => {
    test('renders the Aerial trait label on a character card', () => {
        const card = Object.assign(Object.create(CardComponent.prototype), {
            extraTraits: [TRAIT_AERIAL],
            showAcquiredTraits: true,
        });

        const renderedTraits = card.renderAcquiredTraits();

        assert.ok(
            renderedTraits.strings.join('').includes('acquired-trait'),
        );
        assert.equal(renderedTraits.values[0][0].values[0], 'Aéreo');
    });
});
