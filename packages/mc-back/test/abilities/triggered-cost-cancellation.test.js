import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    PRIORITY_INTERRUPT,
    PRIORITY_RESPONSE,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    TARGET_CARD,
    TARGET_YOU,
    TRIGGER_ENCOUNTER_REVEAL,
    TRIGGER_THIS_ATTACK,
} from 'mc-shared';
import {InterruptAbility} from '../../src/abilities/interrupt/interrupt-ability.js';
import {ResponseAbility} from '../../src/abilities/response/response-ability.js';
import {Arrow} from '../../src/abilities/core/arrow.js';
import {Engine} from '../../src/engine/engine.js';
import {ChainedEffect} from '../../src/effects/chained-effect.js';
import {ExhaustEffect} from '../../src/effects/exhaust-effect.js';
import {SpendEffect} from '../../src/effects/spend-effect.js';
import {Trigger} from '../../src/triggers/base/trigger.js';

const cases = [
    {
        name: 'interrupt',
        AbilityClass: InterruptAbility,
        priority: PRIORITY_INTERRUPT,
        trigger: TRIGGER_ENCOUNTER_REVEAL,
    },
    {
        name: 'response',
        AbilityClass: ResponseAbility,
        priority: PRIORITY_RESPONSE,
        trigger: TRIGGER_THIS_ATTACK,
    },
];

for (const {name, AbilityClass, priority, trigger: triggerType} of cases) {
    test(`cancelling a ${name} payment prompt leaves costs unapplied and offers it again`, async () => {
        const calls = {
            costPrompts: 0,
            effectResolutions: 0,
            generatorUses: 0,
            offers: 0,
        };
        const match = {
            skipDiscardOrderDialog: true,
            triggerCards: {},
            async openDialog({data}) {
                return {selected: data.options[0]};
            },
        };
        const player = {
            isPlayer: true,
            async getCardsToPay() {
                return {generators: [], hand: []};
            },
            async spendResources() {
                calls.costPrompts++;

                if (calls.costPrompts === 1) {
                    return {
                        generators: [{
                            id: `generator-${calls.costPrompts}`,
                            async resolveResourceAbility() {
                                calls.generatorUses++;
                            },
                        }],
                        hand: [],
                        resources: [RESOURCE_MENTAL],
                    };
                }
                if (calls.costPrompts === 2) {
                    return undefined;
                }

                return {
                    generators: [{
                        id: `generator-${calls.costPrompts}`,
                        async resolveResourceAbility() {
                            calls.generatorUses++;
                        },
                    }],
                    hand: [],
                    resources: [calls.costPrompts === 3 ?
                        RESOURCE_MENTAL :
                        RESOURCE_PHYSICAL],
                };
            },
        };
        const card = {
            exhausted: false,
            id: `triggered-${name}`,
            owner: player,
            triggers: {},
            exhaust() {
                this.exhausted = true;
            },
            ready() {
                this.exhausted = false;
            },
            async refresh() {},
        };
        const abilityEffect = {
            resolved: false,
            async canRun() {
                return true;
            },
            async runEffect() {
                calls.effectResolutions++;
                this.resolved = true;
            },
        };
        const cost = new ChainedEffect({
            effects: [
                new ExhaustEffect({
                    target: TARGET_CARD,
                    selectedTarget: card,
                    match,
                }),
                new SpendEffect({
                    resources: [RESOURCE_MENTAL],
                    selectedTarget: player,
                    target: TARGET_YOU,
                    match,
                }),
                new SpendEffect({
                    resources: [RESOURCE_PHYSICAL],
                    selectedTarget: player,
                    target: TARGET_YOU,
                    match,
                }),
            ],
            match,
            matchAll: true,
            selectedTarget: player,
            target: TARGET_YOU,
        });
        const ability = new AbilityClass({
            arrow: new Arrow({cost}),
            effect: abilityEffect,
            match,
            trigger: triggerType,
        });
        ability.card = card;

        const trigger = new Trigger({
            ability,
            card,
            trigger: triggerType,
        });
        card.triggers[triggerType] = {
            [priority]: [trigger],
        };
        match.triggerCards[card.id] = card;

        const engine = new Engine();
        engine.match = match;
        engine._openTriggersDialog = async (triggers, _priority, params) => {
            calls.offers++;
            if (calls.offers === 2) {
                assert.equal(card.exhausted, false);
            }

            const selectedTrigger = triggers[0];
            await selectedTrigger.runTrigger(params);

            return selectedTrigger;
        };

        await engine.trigger(priority, [triggerType], {
            effect: {},
            player,
        });

        assert.equal(calls.offers, 2);
        assert.equal(calls.costPrompts, 4);
        assert.equal(calls.generatorUses, 2);
        assert.equal(calls.effectResolutions, 1);
        assert.equal(card.exhausted, true);
        assert.equal(trigger.triggered, true);
    });
}

test('cancelling an event interrupt cost offers the event again', async () => {
    const calls = {
        offers: 0,
        plays: 0,
    };
    const match = {
        triggerCards: {},
    };
    const player = {
        async triggerEvent() {
            calls.plays++;

            return {
                triggered: calls.plays > 1,
                paymentCancelled: calls.plays === 1,
            };
        },
    };
    const card = {
        id: 'event-interrupt',
        isEvent: true,
        owner: player,
        triggers: {},
    };
    const trigger = new Trigger({
        ability: {
            canTrigger: async () => true,
            hideDialog: false,
            isLasting: false,
        },
        card,
        trigger: TRIGGER_ENCOUNTER_REVEAL,
    });
    card.triggers[TRIGGER_ENCOUNTER_REVEAL] = {
        [PRIORITY_INTERRUPT]: [trigger],
    };
    match.triggerCards[card.id] = card;

    const engine = new Engine();
    engine.match = match;
    engine._openTriggersDialog = async (triggers, _priority, params) => {
        calls.offers++;
        await triggers[0].runTrigger(params);

        return triggers[0];
    };

    await engine.trigger(PRIORITY_INTERRUPT, [TRIGGER_ENCOUNTER_REVEAL], {
        effect: {},
        player,
    });

    assert.equal(calls.offers, 2);
    assert.equal(calls.plays, 2);
    assert.equal(trigger.triggered, true);
});
