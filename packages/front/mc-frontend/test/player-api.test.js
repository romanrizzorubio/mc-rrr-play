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

test('resolveAbility passes a preselected activation target when provided', () => {
    let requestParams;
    const player = new Player({
        post: params => {
            requestParams = params.params;
            return Promise.resolve({ok: true});
        },
    });

    player.resolveAbility('TChalla', 'spider-man', 0, 'rhino');

    assert.deepEqual(requestParams, {
        player: 'TChalla',
        card: 'spider-man',
        ability: 0,
        targetId: 'rhino',
    });
});
