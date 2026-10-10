import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    TARGET_DECK,
    TARGET_PHASE,
    TARGET_PLAYER,
    TARGET_ROUND,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';

test('catalog limits and maximums use target scopes instead of times', async () => {
    const catalog = await loadCatalog();
    const targets = new Set([
        TARGET_DECK,
        TARGET_PHASE,
        TARGET_PLAYER,
        TARGET_ROUND,
    ]);
    let scopeCount = 0;

    const inspect = (value, path = 'catalog') => {
        if (Array.isArray(value)) {
            value.forEach((item, index) => inspect(item, `${path}[${index}]`));
            return;
        }
        if (!value || typeof value !== 'object') {
            return;
        }

        for (const key of ['limit', 'maximum']) {
            const scope = value[key];
            if (scope && typeof scope === 'object' && !Array.isArray(scope)) {
                scopeCount++;
                assert.ok(targets.has(scope.target), `${path}.${key} needs a TARGET_* scope`);
                assert.equal(Object.hasOwn(scope, 'time'), false, `${path}.${key} must not use time`);
            }
        }

        for (const [key, nestedValue] of Object.entries(value)) {
            inspect(nestedValue, `${path}.${key}`);
        }
    };

    inspect(catalog);
    assert.ok(scopeCount > 0);
});
