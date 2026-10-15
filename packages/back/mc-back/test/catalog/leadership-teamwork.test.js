import assert from 'node:assert/strict';
import {test} from 'node:test';

import {TARGET_ALLY_YOU_CONTROL} from 'mc-shared';

import leadershipEvents from '../../../mc-data/seed/catalog/aspects/leadership/events.js';

test('Teamwork exhausts one ally controlled by the player using it', () => {
    const teamwork = leadershipEvents.find(({_id}) =>
        _id === 'leadership-trabajo-en-equipo');
    assert.ok(teamwork);

    teamwork.card.params.abilities.forEach(({params}) => {
        assert.equal(params.arrow.params.target, TARGET_ALLY_YOU_CONTROL);
    });
});
