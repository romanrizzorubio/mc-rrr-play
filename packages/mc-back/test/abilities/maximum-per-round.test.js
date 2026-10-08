import assert from 'node:assert/strict';
import {test} from 'node:test';

import {TIME_ROUND} from 'mc-shared';

import {ActionAbility} from '../../src/abilities/actions/action-ability.js';
import {Effect} from '../../src/effects/effect.js';
import leadershipEvents from '../../../mc-data/seed/catalog/aspects/leadership/events.js';

test('a maximum per round blocks other copies of the same card for every player', async () => {
    const avengersAssemble = leadershipEvents.find(({_id}) =>
        _id === 'leadership-avengers-assemble');
    assert.ok(avengersAssemble);

    const [{params: abilityConfig}] =
        avengersAssemble.card.params.abilities;
    assert.deepEqual(abilityConfig.maximum, {
        count: 1,
        time: TIME_ROUND,
    });

    const match = {limits: {}, triggerCards: {}};
    const createAbility = (id, player) => {
        const effect = {
            resolved: false,
            async canRun() {
                return true;
            },
            async runEffect() {
                this.resolved = true;
            },
        };

        return new ActionAbility({
            card: {
                id,
                isEvent: true,
                name: avengersAssemble.card.params.name,
                owner: player,
            },
            effect,
            match,
            maximum: abilityConfig.maximum,
        });
    };
    const firstPlayer = {};
    const secondPlayer = {};
    const firstCopy = createAbility('first-copy', firstPlayer);
    const secondCopy = createAbility('second-copy', secondPlayer);

    assert.equal(await firstCopy.canRun({player: firstPlayer}), true);
    await firstCopy.resolveAbility({player: firstPlayer});

    assert.equal(firstCopy.maximum.used, 1);
    assert.equal(await secondCopy.canRun({player: secondPlayer}), false);

    new Effect({match}).endLimit(TIME_ROUND);

    assert.equal(await secondCopy.canRun({player: secondPlayer}), true);
});
