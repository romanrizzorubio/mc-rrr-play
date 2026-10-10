import assert from 'node:assert/strict';
import {test} from 'node:test';

import {Player} from '../src/components/api/player.js';

test('resolveAbility returns the REST request promise', () => {
    const request = Promise.resolve({ok: true});
    const player = new Player({
        post: () => request,
    });

    assert.equal(player.resolveAbility('TChalla', 'black-panther-suit', 0), request);
});
