import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    PRIORITY_CONSTANT,
    TRIGGER_CHARACTER_GET_HIT_POINTS,
} from 'mc-shared';
import {Engine} from '../../src/engine/engine.js';
import {Trigger} from '../../src/triggers/base/trigger.js';

describe('trigger resolution concurrency', () => {
    function createFixture(resolveAbility) {
        const engine = new Engine();
        const player = {id: 'player', isPlayer: true};
        const card = {
            id: 'trigger-card',
            controller: player,
            isEvent: false,
            owner: player,
            triggers: {},
        };
        const ability = {
            hideDialog: true,
            isOptionAbility: false,
            keepTriggering: false,
            resolved: false,
            async canTrigger() {
                return true;
            },
            async resolveAbility(params) {
                this.resolved = false;
                await resolveAbility(params);
                this.resolved = true;
            },
        };
        const trigger = new Trigger({
            ability,
            card,
            trigger: TRIGGER_CHARACTER_GET_HIT_POINTS,
        });
        card.triggers[TRIGGER_CHARACTER_GET_HIT_POINTS] = {
            [PRIORITY_CONSTANT]: [trigger],
        };
        engine.match = {
            triggerCards: {
                [card.id]: card,
            },
        };

        return {engine, trigger};
    }

    const resolve = (engine, effect, player) => engine.trigger(
        PRIORITY_CONSTANT,
        [TRIGGER_CHARACTER_GET_HIT_POINTS],
        {effect, player}
    );

    test('resolves independent effects queued on the same trigger', async () => {
        const resolutions = [];
        let startFirst;
        let releaseFirst;
        const firstStarted = new Promise(resolveStarted => {
            startFirst = resolveStarted;
        });
        const firstGate = new Promise(resolveGate => {
            releaseFirst = resolveGate;
        });
        const {engine} = createFixture(async ({effect}) => {
            resolutions.push(effect.id);
            if (effect.id === 'first') {
                startFirst();
                await firstGate;
            }
        });
        const player = {id: 'player', isPlayer: true};
        const first = resolve(engine, {id: 'first'}, player);

        await firstStarted;
        let secondSettled = false;
        const second = resolve(engine, {id: 'second'}, player)
            .finally(() => {
                secondSettled = true;
            });
        await new Promise(resolveNextTurn => setImmediate(resolveNextTurn));
        const secondWaitedForFirst = !secondSettled;

        releaseFirst();
        await Promise.all([first, second]);

        assert.equal(secondWaitedForFirst, true);
        assert.deepEqual(resolutions, ['first', 'second']);
    });

    test('resolves the same effect only once when calls overlap', async () => {
        const resolutions = [];
        let startFirst;
        let releaseFirst;
        const firstStarted = new Promise(resolveStarted => {
            startFirst = resolveStarted;
        });
        const firstGate = new Promise(resolveGate => {
            releaseFirst = resolveGate;
        });
        const {engine} = createFixture(async () => {
            resolutions.push('resolved');
            if (resolutions.length === 1) {
                startFirst();
                await firstGate;
            }
        });
        const player = {id: 'player', isPlayer: true};
        const effect = {id: 'same'};
        const first = resolve(engine, effect, player);

        await firstStarted;
        const duplicate = resolve(engine, effect, player);

        releaseFirst();
        await Promise.all([first, duplicate]);

        assert.deepEqual(resolutions, ['resolved']);
    });

    test('does not re-enter the same trigger from its own resolution', async () => {
        const resolutions = [];
        const nestedEffect = {id: 'nested'};
        const fixture = createFixture(async params => {
            resolutions.push(params.effect.id);
            if (params.effect.id === 'outer') {
                await resolve(fixture.engine, nestedEffect, params.player);
            }
        });
        const {engine} = fixture;

        await resolve(engine, {id: 'outer'}, {id: 'player', isPlayer: true});

        assert.deepEqual(resolutions, ['outer']);
    });
});
