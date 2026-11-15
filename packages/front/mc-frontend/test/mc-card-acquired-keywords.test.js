import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import styles from '../src/components/cards/mc-card/mc-card.css.js';

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

describe('MC card acquired keywords', () => {
    test('shows each acquired keyword on its own unwrapped line', () => {
        const css = styles.cssText;

        assert.match(
            css,
            /\.acquired-keywords\s*\{[^}]*flex-direction:\s*column/s,
        );
        assert.match(
            css,
            /\.acquired-keyword\s*\{[^}]*white-space:\s*nowrap/s,
        );
    });

    test('translates acquired Stalwart to Firmeza', () => {
        const card = Object.assign(Object.create(CardComponent.prototype), {
            extraKeywords: [{name: 'stalwart'}, {name: 'retaliate'}],
        });
        const acquiredKeywords = card.renderAcquiredKeywords();
        const labels = acquiredKeywords.values[0].map(({values}) => values[0]);

        assert.deepEqual(labels, ['Firmeza', 'Represalia']);
    });
});
