import assert from 'node:assert/strict';
import {test} from 'node:test';

import {TARGET_ALL_SUPPORTS} from 'mc-shared';
import {groupTargets} from '../../src/targets/groups.js';

test('TARGET_ALL_SUPPORTS resolves supports from the match search', () => {
    const supports = [
        {id: 'one', isSupport: true},
        {id: 'two', isSupport: true},
    ];
    let searchedCondition;
    const match = {
        searchCards(condition) {
            searchedCondition = condition;
            return supports;
        },
    };

    assert.deepEqual(groupTargets[TARGET_ALL_SUPPORTS]({match}), supports);
    assert.deepEqual(searchedCondition, {isSupport: true});
});
