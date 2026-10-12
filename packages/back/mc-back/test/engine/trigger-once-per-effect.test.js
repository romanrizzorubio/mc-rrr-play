import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    PRIORITY_INTERRUPT,
    TRIGGER_CHARACTER_WOULD_TAKE_DAMAGE,
} from 'mc-shared';
import {Engine} from '../../src/engine/engine.js';
import {Trigger} from '../../src/triggers/base/trigger.js';

const createInterruptCard = (id, resolvedInterrupts) => {
    const owner = {};
    const ability = {
        hideDialog: true,
        isOptionAbility: false,
        keepTriggering: false,
        resolved: false,
        async canTrigger() {
            return true;
        },
        async resolveAbility() {
            resolvedInterrupts.push(id);
            this.resolved = true;
        },
    };
    const card = {
        id,
        isEvent: false,
        owner,
        triggers: {},
    };
    const trigger = new Trigger({
        ability,
        card,
        trigger: TRIGGER_CHARACTER_WOULD_TAKE_DAMAGE,
        triggerParams: {},
    });

    card.triggers[TRIGGER_CHARACTER_WOULD_TAKE_DAMAGE] = {
        [PRIORITY_INTERRUPT]: [trigger],
    };

    return card;
};

const createEngine = cards => {
    const engine = new Engine();
    engine.match = {
        triggerCards: Object.fromEntries(cards.map(card => [card.id, card])),
    };

    return engine;
};

const resolveDamageInterrupts = (engine, effect) =>
    engine.trigger(
        PRIORITY_INTERRUPT,
        [TRIGGER_CHARACTER_WOULD_TAKE_DAMAGE],
        {effect, player: {}}
    );

test('an interrupt can resolve only once for the same damage effect', async () => {
    const resolvedInterrupts = [];
    const card = createInterruptCard('barrier', resolvedInterrupts);
    const engine = createEngine([card]);
    const damageEffect = {};

    await resolveDamageInterrupts(engine, damageEffect);
    await resolveDamageInterrupts(engine, damageEffect);

    assert.deepEqual(resolvedInterrupts, ['barrier']);

    await resolveDamageInterrupts(engine, {});

    assert.deepEqual(resolvedInterrupts, ['barrier', 'barrier']);
});

test('each copy can resolve once for the same damage effect', async () => {
    const resolvedInterrupts = [];
    const firstCopy = createInterruptCard('barrier-1', resolvedInterrupts);
    const secondCopy = createInterruptCard('barrier-2', resolvedInterrupts);
    const engine = createEngine([firstCopy, secondCopy]);
    const damageEffect = {};

    await resolveDamageInterrupts(engine, damageEffect);
    await resolveDamageInterrupts(engine, damageEffect);

    assert.deepEqual(resolvedInterrupts, ['barrier-1', 'barrier-2']);

    await resolveDamageInterrupts(engine, {});

    assert.deepEqual(
        resolvedInterrupts,
        ['barrier-1', 'barrier-2', 'barrier-1', 'barrier-2']
    );
});
