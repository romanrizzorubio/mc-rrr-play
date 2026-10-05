import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    DIALOG_LIST,
    DIALOG_SELECT_CARD,
    DIALOG_USE_CARD,
    PRIORITY_INTERRUPT,
    PRIORITY_RESPONSE,
    PLACE_DISCARD_PILE,
    RESOURCE_ENERGY,
    RESOURCE_ANY,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    TARGET_YOU,
    TRIGGER_ENCOUNTER_REVEAL,
    TRIGGER_THIS_ATTACK,
    TRIGGER_WOULD_PLACE_THREAT,
} from 'mc-shared';
import {Arrow} from '../../src/abilities/core/arrow.js';
import {Ability} from '../../src/abilities/core/ability.js';
import {InterruptAbility} from '../../src/abilities/interrupt/interrupt-ability.js';
import {ResponseAbility} from '../../src/abilities/response/response-ability.js';
import {ChainedEffect} from '../../src/effects/chained-effect.js';
import {Effect} from '../../src/effects/effect.js';
import {PayPrintedCostEffect} from '../../src/effects/pay-printed-cost-effect.js';
import {SearchCardsEffect} from '../../src/effects/search-cards-effect.js';
import {SelectDiscardToCardEffect} from '../../src/effects/select-discard-to-card-effect.js';
import {SimultaneousEffect} from '../../src/effects/simultaneous-effect.js';
import {SpendEffect} from '../../src/effects/spend-effect.js';
import {Engine} from '../../src/engine/engine.js';
import {Trigger} from '../../src/triggers/base/trigger.js';

class ResponseCostEffect extends Effect {
    constructor(params) {
        super(params);
        this.commits = params.commits;
    }
    getTriggersEnds() {
        return [TRIGGER_THIS_ATTACK];
    }
    async execute() {
        this.commits.push('other-cost');
    }
}

class InterruptibleCostEffect extends Effect {
    constructor(params) {
        super(params);
        this.blocked = false;
    }
    canRun() {
        return !this.blocked;
    }
    getTriggersWould() {
        return [TRIGGER_WOULD_PLACE_THREAT];
    }
    async execute() {
        throw new Error('A blocked cost must not execute.');
    }
}

test('stages costs in the chosen order and resolves their responses after all costs', async () => {
    const commits = [];
    const paymentOrder = [];
    const reservedCardIds = [];
    const selectedIndexes = [2, 0];
    const match = {
        openDialog: async ({dialogType, title, data}) => {
            if (dialogType === DIALOG_LIST) {
                assert.equal(title, '¿Qué coste quieres pagar ahora?');
                const selectedIndex = selectedIndexes.shift();

                return {selected: data.options[selectedIndex]};
            }
            if (dialogType === DIALOG_USE_CARD) {
                return {selected: {id: responseCard.id}};
            }
        },
        triggerCards: {},
    };
    const player = {
        hand: {cards: []},
        isPlayer: true,
        async spendResources(resources, _cardToPay, excludedCardIds) {
            const resource = resources[0];
            paymentOrder.push(resource);
            reservedCardIds.push([...excludedCardIds]);
            assert.deepEqual(commits.filter(value => value.startsWith('generator-')), []);

            return {
                generators: [{
                    id: `generator-${resource}`,
                    async resolveResourceAbility() {
                        commits.push(`generator-${resource}`);
                    },
                }],
                hand: [],
                resources,
            };
        },
    };
    const responseCard = {
        id: 'response-card',
        owner: player,
        triggers: {},
        toObj() {
            return {id: this.id};
        },
    };
    const responseEffect = {
        resolved: false,
        async canRun() {
            return true;
        },
        async runEffect() {
            assert.deepEqual(
                commits.filter(value => value.startsWith('generator-')),
                [
                    `generator-${RESOURCE_MENTAL}`,
                    `generator-${RESOURCE_ENERGY}`,
                    `generator-${RESOURCE_PHYSICAL}`,
                ]
            );
            commits.push('response');
            this.resolved = true;
        },
    };
    const responseAbility = new ResponseAbility({
        effect: responseEffect,
        match,
        name: 'Response to cost',
        trigger: TRIGGER_THIS_ATTACK,
    });
    responseAbility.card = responseCard;
    responseCard.triggers[TRIGGER_THIS_ATTACK] = {
        [PRIORITY_RESPONSE]: [
            new Trigger({
                ability: responseAbility,
                card: responseCard,
                trigger: TRIGGER_THIS_ATTACK,
            }),
        ],
    };
    match.triggerCards[responseCard.id] = responseCard;

    const cost = new ChainedEffect({
        effects: [
            new ResponseCostEffect({commits, match, target: TARGET_YOU}),
            new SpendEffect({
                match,
                resources: [RESOURCE_MENTAL],
                selectedTarget: player,
                target: TARGET_YOU,
            }),
            new SpendEffect({
                match,
                resources: [RESOURCE_ENERGY],
                selectedTarget: player,
                target: TARGET_YOU,
            }),
            new SpendEffect({
                match,
                resources: [RESOURCE_PHYSICAL],
                selectedTarget: player,
                target: TARGET_YOU,
            }),
        ],
        match,
        matchAll: true,
        selectedTarget: player,
        target: TARGET_YOU,
    });
    const arrow = new Arrow({cost});
    const abilityEffect = {
        resolved: false,
        async canRun() {
            return true;
        },
        async runEffect() {
            commits.push('ability-effect');
            this.resolved = true;
        },
    };
    const ability = new Ability({
        arrow,
        effect: abilityEffect,
        match,
    });
    ability.card = {id: 'cost-card'};

    await ability.resolveAbility({
        card: ability.card,
        match,
        player,
    });
    assert.equal(ability.resolved, true);
    assert.deepEqual(paymentOrder, [
        RESOURCE_PHYSICAL,
        RESOURCE_MENTAL,
        RESOURCE_ENERGY,
    ]);
    assert.deepEqual(reservedCardIds, [
        [],
        [`generator-${RESOURCE_PHYSICAL}`],
        [`generator-${RESOURCE_PHYSICAL}`, `generator-${RESOURCE_MENTAL}`],
    ]);
    assert.equal(commits.at(-2), 'response');
    assert.equal(commits.at(-1), 'ability-effect');
});

test('stages discard selections and reserves those cards for the remaining costs', async () => {
    const discarded = [];
    const selectedCard = {
        id: 'selected-to-discard',
        isEvent: false,
        toObj() {
            return {id: this.id};
        },
    };
    const resourceCard = {
        id: 'selected-as-resource',
        isEvent: false,
        toObj() {
            return {id: this.id};
        },
    };
    const player = {
        isPlayer: true,
        hand: {
            cards: [selectedCard, resourceCard],
            async refresh() {},
            discardHand(card) {
                this.cards.splice(this.cards.indexOf(card), 1);
            },
        },
        deck: {
            async discard(card) {
                discarded.push(card.id);
            },
            refresh() {},
        },
        async spendResources(resources, _cardToPay, excludedCardIds) {
            assert.ok(excludedCardIds.has(selectedCard.id));
            assert.ok(this.hand.cards.includes(selectedCard));

            return {
                generators: [],
                hand: [resourceCard],
                resources,
            };
        },
    };
    const match = {
        triggerCards: {},
        async openDialog({dialogType, data}) {
            if (dialogType === DIALOG_LIST) {
                return {selected: data.options[0]};
            }

            return {selected: [{id: selectedCard.id}]};
        },
    };
    const cost = new ChainedEffect({
        effects: [
            new SelectDiscardToCardEffect({
                count: 1,
                match,
                selectedTarget: player,
                target: TARGET_YOU,
            }),
            new SpendEffect({
                match,
                resources: [RESOURCE_MENTAL],
                selectedTarget: player,
                target: TARGET_YOU,
            }),
        ],
        match,
        matchAll: true,
        selectedTarget: player,
        target: TARGET_YOU,
    });
    const arrow = new Arrow({cost});

    assert.equal(await arrow.pay({
        card: {id: 'ability-card'},
        match,
        player,
    }), true);
    assert.deepEqual(discarded, [
        selectedCard.id,
        resourceCard.id,
    ]);
    assert.deepEqual(player.hand.cards, []);
});

test('staged search choices are passed through Arrow outputParams', async () => {
    const selectedCard = {
        id: 'searched-card',
        toObj() {
            return {id: this.id};
        },
    };
    const player = {
        hand: {cards: []},
        deck: {discardPile: [selectedCard]},
        isPlayer: true,
        async spendResources(resources) {
            return {
                generators: [],
                hand: [],
                resources,
            };
        },
    };
    const match = {
        players: [player],
        triggerCards: {},
        async openDialog({dialogType, data}) {
            if (dialogType === DIALOG_LIST) {
                return {selected: data.options[0]};
            }
            if (dialogType === DIALOG_SELECT_CARD) {
                return {selected: [{id: selectedCard.id}]};
            }
        },
    };
    const cost = new ChainedEffect({
        effects: [
            new SearchCardsEffect({
                locations: [PLACE_DISCARD_PILE],
                match,
                selectedTarget: player,
                target: TARGET_YOU,
            }),
            new SpendEffect({
                match,
                resources: [RESOURCE_MENTAL],
                selectedTarget: player,
                target: TARGET_YOU,
            }),
        ],
        match,
        matchAll: true,
        outputParams: ['selectedCard'],
        selectedTarget: player,
        target: TARGET_YOU,
    });
    const params = {
        card: {id: 'ability-card'},
        player,
    };
    const arrow = new Arrow({cost});

    assert.equal(await arrow.pay(params), true);
    assert.equal(params.selectedCard, selectedCard);
});

test('stages the selected card printed cost after preparing a search choice', async () => {
    const selectedCard = {
        id: 'maria-hill',
        name: 'Maria Hill',
        cost: 2,
        toObj() {
            return {id: this.id, name: this.name};
        },
    };
    const paymentOrder = [];
    const player = {
        deck: {discardPile: [selectedCard]},
        hand: {cards: []},
        isPlayer: true,
        async spendResources(resources, cardToPay) {
            paymentOrder.push('printed-cost');
            assert.equal(cardToPay, selectedCard);
            assert.deepEqual(resources, Array(selectedCard.cost).fill(RESOURCE_ANY));

            return {
                generators: [],
                hand: [],
                resources,
            };
        },
    };
    const match = {
        players: [player],
        triggerCards: {},
        async openDialog({dialogType, data}) {
            assert.equal(dialogType, DIALOG_SELECT_CARD);
            paymentOrder.push('select-card');

            return {selected: [{id: data.cards[0].id}]};
        },
    };
    const cardToPlay = {id: 'ability-card', cost: 0};
    const cost = new SimultaneousEffect({
        effects: [
            new SearchCardsEffect({
                locations: [PLACE_DISCARD_PILE],
                match,
                selectedTarget: player,
                target: TARGET_YOU,
            }),
            new PayPrintedCostEffect({
                match,
                selectedTarget: player,
                target: TARGET_YOU,
            }),
        ],
        match,
        matchAll: true,
        outputParams: ['selectedCard'],
        selectedTarget: player,
        target: TARGET_YOU,
    });
    const params = {card: cardToPlay, player};

    assert.equal(await new Arrow({cost}).pay(params), true);
    assert.deepEqual(paymentOrder, ['select-card', 'printed-cost']);
    assert.equal(params.selectedCard, selectedCard);
    assert.equal(params.card, cardToPlay);
});

test('does not re-offer an ability when a cost interrupt makes payment impossible', async () => {
    const calls = {
        blockedCostInterrupts: 0,
        abilityEffects: 0,
        offers: 0,
    };
    const match = {
        openDialog: async ({data}) => {
            return {selected: {id: data.cards[0].id}};
        },
        triggerCards: {},
    };
    const player = {
        hand: {cards: []},
        isPlayer: true,
        async spendResources() {
            assert.fail('A blocked cost must not open its payment dialog.');
        },
    };
    const interruptCard = {
        id: 'cost-blocker',
        owner: player,
        triggers: {},
        toObj() {
            return {id: this.id};
        },
    };
    const cost = new InterruptibleCostEffect({
        match,
        selectedTarget: player,
        target: TARGET_YOU,
    });
    const interruptEffect = {
        resolved: false,
        async canRun() {
            return true;
        },
        async runEffect({effect}) {
            calls.blockedCostInterrupts++;
            effect.blocked = true;
            this.resolved = true;
        },
    };
    const interruptAbility = new InterruptAbility({
        effect: interruptEffect,
        match,
        trigger: TRIGGER_WOULD_PLACE_THREAT,
    });
    interruptAbility.card = interruptCard;
    interruptCard.triggers[TRIGGER_WOULD_PLACE_THREAT] = {
        [PRIORITY_INTERRUPT]: [
            new Trigger({
                ability: interruptAbility,
                card: interruptCard,
                trigger: TRIGGER_WOULD_PLACE_THREAT,
            }),
        ],
    };
    match.triggerCards[interruptCard.id] = interruptCard;

    const abilityCard = {
        id: 'blocked-cost-interrupt',
        owner: player,
        triggers: {},
        toObj() {
            return {id: this.id};
        },
    };
    const abilityEffect = {
        resolved: false,
        async canRun() {
            return true;
        },
        async runEffect() {
            calls.abilityEffects++;
            this.resolved = true;
        },
    };
    const ability = new InterruptAbility({
        arrow: new Arrow({cost}),
        effect: abilityEffect,
        match,
        trigger: TRIGGER_ENCOUNTER_REVEAL,
    });
    ability.card = abilityCard;
    const trigger = new Trigger({
        ability,
        card: abilityCard,
        trigger: TRIGGER_ENCOUNTER_REVEAL,
    });
    abilityCard.triggers[TRIGGER_ENCOUNTER_REVEAL] = {
        [PRIORITY_INTERRUPT]: [trigger],
    };
    match.triggerCards[abilityCard.id] = abilityCard;

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

    assert.equal(calls.offers, 1);
    assert.equal(calls.blockedCostInterrupts, 1);
    assert.equal(calls.abilityEffects, 0);
    assert.equal(ability.arrow.paymentBlocked, true);
    assert.equal(ability.arrow.paymentCancelled, false);
});
