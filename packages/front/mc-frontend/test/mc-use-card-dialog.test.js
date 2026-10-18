import assert from 'node:assert/strict';
import {test} from 'node:test';

import styles from '../src/components/dialog/mc-use-card-dialog/mc-use-card-dialog.css.js';

test('aligns interrupt and response cards to the bottom', () => {
    assert.match(
        styles.cssText,
        /mc-card-list\s*{[^}]*align-items:\s*flex-end/s
    );
});
