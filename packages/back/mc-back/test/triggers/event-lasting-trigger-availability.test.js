import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {PRIORITY_CONSTANT, TRIGGER_PHASE_ENDS} from 'mc-shared';
import {EndLastingEffect} from '../../src/effects/end-lasting-effect.js';
import {ModifyThwartValueEffect} from '../../src/effects/modify-thwart-value-effect.js';
import {Engine} from '../../src/engine/engine.js';
import {EndLastingAbility} from '../../src/abilities/misc/end-lasting-ability.js';
import {LastingAbility} from '../../src/abilities/misc/lasting-ability.js';
import {Trigger} from '../../src/triggers/base/trigger.js';

const lastingAbilityTypes = [
    ['lasting', LastingAbility],
    ['expiration', EndLastingAbility],
];

function createLastingEventTrigger(AbilityType, canTrigger = true) {
    const player = {
        hand: {cards: []},
    };
    const card = {
        id: 'played-event',
        isEvent: true,
        owner: player,
    };
    const ability = new AbilityType({
        card,
        match: {triggerCards: {}},
        trigger: TRIGGER_PHASE_ENDS,
        lasting: {},
    });
    ability.canTrigger = () => canTrigger;
    ability.resolveAbility = async () => {
        ability.resolved = true;
    };
    player.triggerEvent = async () => {
        throw new Error('A lasting ability on an event should resolve as a card ability.');
    };

    return {
        ability,
        player,
        trigger: new Trigger({
            ability,
            card,
            trigger: TRIGGER_PHASE_ENDS,
        }),
    };
}

describe('event triggers for lasting abilities', () => {
    test('phase expiry cleans up a stat modifier from a played event', async () => {
        const player = {hand: {cards: []}};
        const match = {
            lasting: [],
            triggerCards: {},
        };
        const hero = {
            isCard: true,
            modifyThwart: 1,
            async refresh() {},
        };
        const event = {
            id: 'played-event',
            isEvent: true,
            owner: player,
            triggers: {},
            removeLastingTriggers(lasting) {
                assert.equal(lasting, match.lasting[0]);
                this.triggers = {};
                delete match.triggerCards[this.id];
            },
        };
        const cleanup = new ModifyThwartValueEffect({
            count: -1,
            isCleanup: true,
            match,
            selectedTarget: hero,
        });
        const lasting = {
            card: event,
            cleanups: [cleanup],
            match,
            player,
            selectedTarget: hero,
            triggerCard: event,
        };
        match.lasting.push(lasting);
        const ability = new EndLastingAbility({
            card: event,
            effect: new EndLastingEffect({match}),
            hideDialog: true,
            lasting,
            match,
            trigger: TRIGGER_PHASE_ENDS,
        });
        ability.canRun = async () => true;
        ability.initTriggers(event);

        const phase = new Engine();
        phase.match = match;
        await phase.trigger(
            PRIORITY_CONSTANT,
            [TRIGGER_PHASE_ENDS],
            {arrowPaid: true, effect: {}, player}
        );

        assert.equal(hero.modifyThwart, 0);
        assert.deepEqual(match.lasting, []);
        assert.equal(match.triggerCards[event.id], undefined);
    });

    for (const [name, AbilityType] of lastingAbilityTypes) {
        test(`${name} abilities remain available after their event leaves hand`, async () => {
            const {ability, player, trigger} =
                createLastingEventTrigger(AbilityType);

            assert.equal(await trigger.canTrigger({player}), true);
            await trigger.runTrigger({player});

            assert.equal(ability.resolved, true);
            assert.equal(trigger.triggered, true);
        });
    }

    test('non-lasting event triggers still require the event to be in hand', async () => {
        const player = {hand: {cards: []}};
        const card = {isEvent: true, owner: player};
        let availabilityChecks = 0;
        const trigger = new Trigger({
            ability: {
                canTrigger() {
                    availabilityChecks++;
                    return true;
                },
            },
            card,
        });

        assert.equal(await trigger.canTrigger({player}), false);
        assert.equal(availabilityChecks, 0);
    });

    test('lasting event triggers still respect their own availability checks', async () => {
        const {player, trigger} =
            createLastingEventTrigger(LastingAbility, false);

        assert.equal(await trigger.canTrigger({player}), false);
    });
});
