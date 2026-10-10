import assert from 'node:assert/strict';
import {test} from 'node:test';

import {ENDPOINTS} from 'mc-endpoints';
import {ConfigMatch} from '../src/components/api/config-match.js';

test('ConfigMatch resets a match by its stable ID', async () => {
    const requests = [];
    const api = {
        async post(request) {
            requests.push(request);

            return {id: 'match-id'};
        },
    };
    const configMatch = new ConfigMatch(api);

    assert.deepEqual(await configMatch.resetMatch('match-id'), {id: 'match-id'});
    assert.deepEqual(requests, [{
        endpoint: ENDPOINTS.MATCH.RESET,
        params: {id: 'match-id'},
    }]);
});
