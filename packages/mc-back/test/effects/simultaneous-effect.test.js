import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    CALC_RESOURCES,
    EFFECT_CHAINED,
    EFFECT_CHOOSE_ABILITY,
    EFFECT_DEAL_DAMAGE,
    EFFECT_DISCARD_FROM_DECK,
    EFFECT_DRAW_CARD,
    EFFECT_DO_IF_HAS_TRAITS,
    EFFECT_FILL_HAND,
    EFFECT_REVEAL_ENCOUNTER,
    EFFECT_SIMULTANEOUS,
    EFFECT_STUN,
    PRIORITY_INTERRUPT,
    TRIGGER_ENCOUNTER_REVEAL,
} from 'mc-shared';
import {InterruptAbility} from '../../src/abilities/interrupt/interrupt-ability.js';
import {Engine} from '../../src/engine/engine.js';
import {ConstantAbility} from '../../src/abilities/misc/constant-ability.js';
import {AbilitiesFactory} from '../../src/factory/abilities/abilities-factory.js';
import {ChainedEffect} from '../../src/effects/chained-effect.js';
import {Effect} from '../../src/effects/effect.js';
import {SimultaneousEffect} from '../../src/effects/simultaneous-effect.js';
import {Trigger} from '../../src/triggers/base/trigger.js';
import aggressionAllies from '../../../mc-data/seed/catalog/aspects/aggression/allies.js';
import blackPanther from '../../../mc-data/seed/catalog/heroes/blackpanther.js';
import captainMarvel from '../../../mc-data/seed/catalog/heroes/captain-marvel.js';
import ironMan from '../../../mc-data/seed/catalog/heroes/ironman.js';
import leadershipEvents from '../../../mc-data/seed/catalog/aspects/leadership/events.js';
import protectionAllies from '../../../mc-data/seed/catalog/aspects/protection/allies.js';
import sheHulk from '../../../mc-data/seed/catalog/heroes/she-hulk.js';
import spiderMan from '../../../mc-data/seed/catalog/heroes/spiderman.js';

class StagedEffect extends Effect {
    constructor({cancel = false, calls, label, ...params}) {
        super(params);
        this.cancel = cancel;
        this.calls = calls;
        this.label = label;
    }
    getCostPaymentEffects() {
        return [this];
    }
    getCostPaymentTitle() {
        return this.label;
    }
    shouldPromptForPayment() {
        return true;
    }
    async preparePayment() {
        this.calls.push(`select:${this.label}`);

        return this.cancel ? undefined : {
            generators: [],
            hand: [],
            reservedCards: [],
        };
    }
    async execute(params) {
        params.costPaymentSession.getPayment(this);
        this.calls.push(`commit:${this.label}`);
    }
    async triggerEnds(params) {
        params.costPaymentSession.deferResponse(async () => {
            this.calls.push(`response:${this.label}`);
        });
    }
}

class PartiallyResolvedEffect extends Effect {
    async execute() {}
    isResolved() {
        return true;
    }
    isFullResolved() {
        return false;
    }
}

class CompletedEffect extends Effect {
    async execute() {}
}

test('simultaneous effects stage every dialog before committing and defer responses', async () => {
    const calls = [];
    const match = {
        triggerCards: {},
        async openDialog({data}) {
            calls.push('choose');

            return {selected: data.options[1]};
        },
    };
    const effect = new SimultaneousEffect({
        effects: [
            new StagedEffect({calls, label: 'first', match}),
            new StagedEffect({calls, label: 'second', match}),
        ],
        match,
    });

    await effect.runEffect({match, player: {}});

    assert.deepEqual(calls, [
        'choose',
        'select:second',
        'select:first',
        'commit:first',
        'commit:second',
        'response:first',
        'response:second',
    ]);
    assert.equal(effect.fullResolved, true);
});

test('cancelling a simultaneous payment prevents every effect from committing', async () => {
    const calls = [];
    const match = {
        triggerCards: {},
        async openDialog({data}) {
            calls.push('choose');

            return {selected: data.options[1]};
        },
    };
    const effect = new SimultaneousEffect({
        effects: [
            new StagedEffect({calls, label: 'first', match}),
            new StagedEffect({cancel: true, calls, label: 'second', match}),
        ],
        match,
    });

    await effect.runEffect({match, player: {}});

    assert.deepEqual(calls, [
        'choose',
        'select:second',
    ]);
    assert.equal(effect.paymentCancelled, true);
});

test('cancelling a simultaneous triggered effect offers the interrupt again', async () => {
    const calls = [];
    const match = {
        triggerCards: {},
        async openDialog({data}) {
            return {selected: data.options[1]};
        },
    };
    const player = {isPlayer: true};
    const card = {
        id: 'simultaneous-interrupt',
        owner: player,
        triggers: {},
    };
    const secondEffect = new StagedEffect({
        cancel: true,
        calls,
        label: 'second',
        match,
    });
    const effect = new SimultaneousEffect({
        effects: [
            new StagedEffect({calls, label: 'first', match}),
            secondEffect,
        ],
        match,
    });
    const ability = new InterruptAbility({
        effect,
        match,
        trigger: TRIGGER_ENCOUNTER_REVEAL,
    });
    ability.card = card;

    const trigger = new Trigger({
        ability,
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
        calls.push('offer');
        if (calls.filter(value => value === 'offer').length === 2) {
            secondEffect.cancel = false;
        }

        await triggers[0].runTrigger(params);

        return triggers[0];
    };

    await engine.trigger(PRIORITY_INTERRUPT, [TRIGGER_ENCOUNTER_REVEAL], {
        effect: {},
        player,
    });

    assert.equal(calls.filter(value => value === 'offer').length, 2);
    assert.equal(calls.filter(value => value.startsWith('commit:')).length, 2);
    assert.equal(effect.fullResolved, true);
    assert.equal(trigger.triggered, true);
});

test('thenEffect only runs when all preceding effects fully resolve', async () => {
    const match = {triggerCards: {}};
    let thenRuns = 0;
    const thenEffect = {
        async runEffect() {
            thenRuns++;
        },
    };
    const partial = new ChainedEffect({
        effects: [new PartiallyResolvedEffect({match})],
        match,
        thenEffect,
    });

    await partial.runEffect({match, player: {}});
    assert.equal(thenRuns, 0);

    const simultaneous = new SimultaneousEffect({
        effects: [
            new PartiallyResolvedEffect({match}),
            new CompletedEffect({match}),
        ],
        match,
        thenEffect,
    });

    await simultaneous.runEffect({match, player: {}});
    assert.equal(thenRuns, 0);

    const complete = new ChainedEffect({
        effects: [new CompletedEffect({match})],
        match,
        thenEffect,
    });

    await complete.runEffect({match, player: {}});
    assert.equal(thenRuns, 1);
});

test('Doble personalidad fills the hand only after the flip resolves', () => {
    const match = {triggerCards: {}};
    const factory = new AbilitiesFactory({match});
    const card = sheHulk.config.cards.find(({card: cardData}) =>
        cardData.params.name === 'Doble personalidad');
    const effectConfig = card.card.params.abilities[0].params.effect;
    const effect = factory.effectsFactory.parseEffect(effectConfig);

    assert.ok(effect instanceof ChainedEffect);
    assert.equal(effect.effects.length, 1);
    assert.equal(effect.effects[0].thenEffect.effectType, EFFECT_FILL_HAND);
});

test('Rayo repulsor discards first and applies its complete calculated damage once', () => {
    const match = {triggerCards: {}};
    const factory = new AbilitiesFactory({match});
    const card = ironMan.config.cards.find(({card: cardData}) =>
        cardData.params.name === 'Rayo repulsor');
    const effectConfig = card.card.params.abilities[0].params.effect;
    const effect = factory.effectsFactory.parseEffect(effectConfig);

    assert.ok(effect instanceof ChainedEffect);
    assert.deepEqual(effect.effects.map(child => child.effectType), [
        EFFECT_DISCARD_FROM_DECK,
        EFFECT_DEAL_DAMAGE,
    ]);
    assert.equal(effect.effects[1].paramsCalc.formula, CALC_RESOURCES);
    assert.equal(effect.effects[1].paramsCalc.multiply, 2);
    assert.equal(effect.effects[1].paramsCalc.plus, 1);
});

test('La furia de Titania resolves its alternative heal and surge simultaneously', () => {
    const match = {triggerCards: {}};
    const factory = new AbilitiesFactory({match});
    const effectConfig = sheHulk.config.nemesis[3].card.params.abilities[0]
        .params.ifNot;
    const effect = factory.effectsFactory.parseEffect(effectConfig);

    assert.ok(effect instanceof SimultaneousEffect);
    assert.equal(effect.effects.length, 2);
});

test('Dagas de energía resolves both damage effects simultaneously', () => {
    const match = {triggerCards: {}};
    const factory = new AbilitiesFactory({match});
    const card = blackPanther.config.cards.find(({card: cardData}) =>
        cardData.params.name === 'Dagas de energía');
    const effectConfig = card.card.params.abilities[0].params.effect;
    const effect = factory.effectsFactory.parseEffect(effectConfig);

    assert.ok(effect instanceof SimultaneousEffect);
    assert.equal(effect.effects.length, 2);
});

test('Hierba con forma de corazón gives tough simultaneously to villain and minions', () => {
    const match = {triggerCards: {}};
    const factory = new AbilitiesFactory({match});
    const card = blackPanther.config.nemesis[2];
    const effectConfig = card.card.params.abilities[0].params.effect;
    const effect = factory.effectsFactory.parseEffect(effectConfig);

    assert.ok(effect instanceof SimultaneousEffect);
    assert.equal(effect.effects.length, 2);
});

test('Combate ritual chooses an ability only after discarding the encounter card', () => {
    const match = {triggerCards: {}};
    const factory = new AbilitiesFactory({match});
    const effectConfig = blackPanther.config.nemesis[3].card.params.abilities[0]
        .params.effect;
    const effect = factory.effectsFactory.parseEffect(effectConfig);

    assert.ok(effect instanceof ChainedEffect);
    assert.equal(effect.effects.length, 1);
    assert.equal(effect.effects[0].thenEffect.effectType, EFFECT_CHOOSE_ABILITY);
});

test('Envuelto en telaraña resolves cancellation and discard together, then stuns', () => {
    const match = {triggerCards: {}};
    const factory = new AbilitiesFactory({match});
    const card = spiderMan.config.cards.find(({card: cardData}) =>
        cardData.params.name === 'Envuelto en telaraña');
    const effectConfig = card.card.params.abilities[0].params.effect;
    const effect = factory.effectsFactory.parseEffect(effectConfig);

    assert.ok(effect instanceof ChainedEffect);
    assert.ok(effect.effects[0] instanceof SimultaneousEffect);
    assert.equal(effect.effects[0].effects.length, 2);
    assert.equal(effect.thenEffect.effectType, EFFECT_STUN);
});

test('Evitar una crisis performs its aerial bonus only after removing threat', () => {
    const match = {triggerCards: {}};
    const factory = new AbilitiesFactory({match});
    const card = captainMarvel.config.cards.find(({card: cardData}) =>
        cardData.params.name === 'Evitar una crisis');
    const effectConfig = card.card.params.abilities[0].params.effect;
    const effect = factory.effectsFactory.parseEffect(effectConfig);

    assert.ok(effect instanceof ChainedEffect);
    assert.equal(effect.effects.length, 1);
    assert.equal(effect.effects[0].thenEffect.effectType, EFFECT_DO_IF_HAS_TRAITS);
});

test('Base orbital resolves one draw with a form-dependent count', async () => {
    const match = {triggerCards: {}};
    const factory = new AbilitiesFactory({match});
    const card = captainMarvel.config.cards.find(({card: cardData}) =>
        cardData.params.name === 'Base orbital de Alpha Flight');
    const effectConfig = card.card.params.abilities[0].params.effect;
    const effect = factory.effectsFactory.parseEffect(effectConfig);
    const drawCounts = [];
    const player = {
        deck: {
            async draw(count) {
                drawCounts.push(count);

                return [];
            },
        },
        hand: {
            addCards() {},
            async refresh() {},
        },
        isAlterEgo: false,
        isPlayer: true,
    };
    effect.selectedTarget = player;

    assert.equal(effect.effectType, EFFECT_DRAW_CARD);
    await effect.execute({player});
    player.isAlterEgo = true;
    await effect.execute({player});

    assert.deepEqual(drawCounts, [1, 2]);
});

test('Liderar en vanguardia applies its attack and thwart modifiers simultaneously', () => {
    const match = {triggerCards: {}};
    const factory = new AbilitiesFactory({match});
    const card = leadershipEvents.find(({card: cardData}) =>
        cardData.params.name === 'Liderar en vanguardia');
    const effectConfig = card.card.params.abilities[0].params.effect;
    const effect = factory.effectsFactory.parseEffect(effectConfig);

    assert.ok(effect.effect instanceof SimultaneousEffect);
    assert.equal(effect.effect.effects.length, 2);
});

test('Hulk resolves the wild-resource branch as one simultaneous group', () => {
    const match = {triggerCards: {}};
    const factory = new AbilitiesFactory({match});
    const card = aggressionAllies.find(({card: cardData}) =>
        cardData.params.name === 'Hulk');
    const wildBranch = card.card.params.abilities[0].params.effect
        .params.effects[4].params.effect;
    const effect = factory.effectsFactory.parseEffect(wildBranch);

    assert.ok(effect instanceof SimultaneousEffect);
    assert.equal(effect.effects.length, 3);
});

test('Black Widow reveals a replacement encounter card only after cancellation', () => {
    const match = {triggerCards: {}};
    const factory = new AbilitiesFactory({match});
    const card = protectionAllies.find(({card: cardData}) =>
        cardData.params.name === 'Viuda Negra');
    const effectConfig = card.card.params.abilities[0].params.effect;
    const effect = factory.effectsFactory.parseEffect(effectConfig);

    assert.ok(effect instanceof ChainedEffect);
    assert.equal(effect.effects.length, 1);
    assert.equal(effect.effects[0].thenEffect.effectType, EFFECT_REVEAL_ENCOUNTER);
});

test('chained effects inside an ability cost are parsed as simultaneous', () => {
    const match = {triggerCards: {}};
    const factory = new AbilitiesFactory({match});
    const parsedSimultaneous = factory.effectsFactory.parseEffect({
        type: EFFECT_SIMULTANEOUS,
        params: {effects: []},
    });
    const {params} = factory._parseAbility({
        type: 'action',
        params: {
            arrow: {
                type: EFFECT_CHAINED,
                params: {
                    effects: [],
                    thenEffect: {
                        type: EFFECT_CHAINED,
                        params: {
                            effects: [],
                        },
                    },
                },
            },
        },
    });

    assert.ok(parsedSimultaneous instanceof SimultaneousEffect);
    assert.ok(params.arrow.cost instanceof SimultaneousEffect);
    assert.ok(params.arrow.cost.thenEffect instanceof ChainedEffect);
});

test('simultaneous constant effects stay hidden when every child is automatic', () => {
    const ability = new ConstantAbility({
        effect: {
            effectType: EFFECT_SIMULTANEOUS,
            effects: [{effectType: 'modify-attack-value'}],
        },
        match: {},
    });

    assert.equal(ability.hideDialog, true);
});
