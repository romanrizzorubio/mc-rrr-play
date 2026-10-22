import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import styles from '../src/components/cards/mc-card/mc-card.css.js';

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
});
