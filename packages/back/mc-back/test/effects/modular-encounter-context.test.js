import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    CALC_BOOST_ICONS,
    EFFECT_TAKE_DAMAGE,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    TARGET_YOU,
} from 'mc-shared';
import aMessOfThings from '../../../mc-data/seed/catalog/sets/a-mess-of-things.js';
import powerDrain from '../../../mc-data/seed/catalog/sets/power-drain.js';
import runningInterference from '../../../mc-data/seed/catalog/sets/running-interference.js';
import {Attack} from '../../src/activations/attack.js';
import {AssignDamageEffect} from '../../src/effects/assign-damage-effect.js';
import {ResolveAbilityEffect} from '../../src/effects/resolve-ability-effect.js';
import {RevealEncounterEffect} from '../../src/effects/reveal-encounter-effect.js';
import {SelectDiscardToFindCardEffect} from '../../src/effects/select-discard-to-find-card-effect.js';
import {TakeDamageEffect} from '../../src/effects/take-damage-effect.js';
import {CardsFactory} from '../../src/factory/cards/cards-factory.js';

const createHandCard = (id, resources) => ({
    id,
    resources,
    toObj() {
        return {id};
    },
});

function createPlayer(cards) {
    const discarded = [];
    const player = {
        hand: {
            cards: cards.slice(),
            discardHand(card) {
                this.cards = this.cards.filter(candidate => candidate !== card);
            },
            async refresh() {},
        },
        deck: {
            async discard(card) {
                discarded.push(card);
            },
            refresh() {},
        },
    };

    return {player, discarded};
}

test('SelectDiscardToFindCardEffect calculates discarded resources from the prior encounter discard results', async () => {
    const cards = [
        createHandCard('mental', [RESOURCE_MENTAL]),
        createHandCard('physical', [RESOURCE_PHYSICAL]),
        createHandCard('unused', [RESOURCE_MENTAL]),
    ];
    const {player, discarded} = createPlayer(cards);
    const effect = new SelectDiscardToFindCardEffect({
        count: 0,
        paramsCalc: {
            target: 'effects.0.cards',
            formula: CALC_BOOST_ICONS,
        },
        cardCondition: {
            resources: [RESOURCE_MENTAL, RESOURCE_PHYSICAL],
        },
        target: TARGET_YOU,
        upTo: false,
        match: {triggerCards: {}},
    });
    const dialogs = [];
    effect.selectedTarget = player;
    effect.openDialog = async dialog => {
        dialogs.push(dialog);

        return {
            selected: dialog.data.cards
                .slice(0, dialog.data.count)
                .map(({id}) => ({id})),
        };
    };

    await effect.execute({
        player,
        effects: [{
            cards: [{boost: 1}, {boost: 2}, {boost: 0}],
        }],
    });

    assert.equal(dialogs[0].data.count, 3);
    assert.equal(dialogs[0].data.upTo, false);
    assert.deepEqual(discarded, cards);
    assert.deepEqual(player.hand.cards, []);
});

test('High Voltage counts printed resource icons and prompts for the required icon count', async () => {
    const match = {triggerCards: {}, players: []};
    const factory = new CardsFactory({match});
    match.effectsFactory = factory.abilitiesFactory.effectsFactory;
    const highVoltageConfig = powerDrain.config.cards.find(({card}) =>
        card.params.name === 'Alta tensión').card;
    const highVoltage = factory.createGameCard({
        card: factory.createCard(highVoltageConfig),
        owner: {},
    });
    const forEachEffect = highVoltage.abilities[0].effect.effects[1];
    const effect = forEachEffect.createTargetEffect();
    const dualResourceCard = createHandCard('dual-resource', [
        RESOURCE_MENTAL,
        RESOURCE_PHYSICAL,
    ]);
    const singleResourceCard = createHandCard('single-resource', [
        RESOURCE_MENTAL,
    ]);
    const {player, discarded} = createPlayer([
        dualResourceCard,
        singleResourceCard,
    ]);
    const dialogs = [];
    const effectParams = {
        player,
        effects: [{
            cards: [{boost: 2}, {boost: 1}],
        }],
    };

    effect.selectedTarget = player;
    effect.openDialog = async dialog => {
        dialogs.push(dialog);

        return {
            selected: [dialog.data.cards.find(card =>
                card.id === dualResourceCard.id)],
        };
    };

    assert.equal(await effect.canRun(effectParams), true);
    await effect.execute(effectParams);

    assert.equal(dialogs.length, 1);
    assert.equal(dialogs[0].data.count, 1);
    assert.equal(dialogs[0].data.instruction, 'Descarta 3 iconos de recursos.');
    assert.equal(
        dialogs[0].subtitle,
        'Cada icono de recurso impreso cuenta por separado.'
    );
    assert.deepEqual(discarded, [dualResourceCard, singleResourceCard]);
    assert.deepEqual(player.hand.cards, []);
});

test('resource requirements accept one card with both printed icons and reject an incomplete hand', async () => {
    const dualResourceCard = createHandCard('mental-physical', [
        RESOURCE_MENTAL,
        RESOURCE_PHYSICAL,
    ]);
    const {player, discarded} = createPlayer([dualResourceCard]);
    const match = {triggerCards: {}};
    const effect = new SelectDiscardToFindCardEffect({
        match,
        target: TARGET_YOU,
        resourceRequirements: [
            [RESOURCE_MENTAL],
            [RESOURCE_PHYSICAL],
        ],
    });
    effect.selectedTarget = player;
    effect.openDialog = async () => {
        assert.fail('A single eligible card should be selected without a dialog.');
    };

    assert.equal(await effect.canRun({match, player}), true);
    await effect.execute({match, player});
    assert.deepEqual(discarded, [dualResourceCard]);

    const incompletePlayer = createPlayer([
        createHandCard('only-physical', [RESOURCE_PHYSICAL]),
    ]).player;
    effect.selectedTarget = incompletePlayer;
    assert.equal(await effect.canRun({match, player: incompletePlayer}), false);
});

test('AssignDamageEffect calculates indirect damage from the discarded cards in its runtime context', async () => {
    const damageEvents = [];
    const target = {
        id: 'hero',
        async getEffectiveStats() {
            return {hitPoints: 10, life: 10};
        },
        toObj() {
            return {id: this.id};
        },
    };
    const match = {
        triggerCards: {},
        effectsFactory: {
            createEffect({damage, selectedTarget, type}) {
                assert.equal(type, EFFECT_TAKE_DAMAGE);

                return {
                    async runEffect() {
                        damageEvents.push({damage, target: selectedTarget});
                    },
                };
            },
        },
    };
    const effect = new AssignDamageEffect({
        damage: 0,
        match,
        paramsCalc: {
            target: 'effects.0.cards',
            formula: CALC_BOOST_ICONS,
        },
        selectedTarget: [target],
    });

    await effect.execute({
        player: {},
        effects: [{
            cards: [{boost: 1}, {boost: 2}],
        }],
    });

    assert.deepEqual(damageEvents, [{damage: 3, target}]);
});

test('Electro is selected from the cards discarded by the triggering effect', () => {
    const match = {triggerCards: {}, players: []};
    const factory = new CardsFactory({match});
    const pulseCard = powerDrain.config.cards.find(({card}) =>
        card.params.name === 'Pulso electromagnético').card;
    const pulse = factory.createGameCard({
        card: factory.createCard(pulseCard),
        owner: {},
    });
    const engageEffect = pulse.abilities[0].effect.effects[1].effect;
    const discardedElectro = {name: 'Electro', isMinion: true};

    assert.equal(engageEffect.cardSource, 'effects.0.cards');
    assert.strictEqual(
        engageEffect.getCard({
            effects: [{
                cards: [{name: 'Otra carta'}, discardedElectro],
            }],
        }),
        discardedElectro
    );
    assert.equal(engageEffect.getCard({effects: [{cards: []}]}), undefined);
});

test('media coverage resolves every revealed ability once more only for its attached player', async () => {
    const match = {triggerCards: {}, players: []};
    const factory = new CardsFactory({match});
    const mediaCardConfig = runningInterference.config.cards.find(({card}) =>
        card.params.name === 'Cobertura mediática').card;
    const mediaCard = factory.createGameCard({
        card: factory.createCard(mediaCardConfig),
        owner: {},
    });
    const player = {
        isPlayer: true,
        name: 'Attached player',
        hand: {cards: []},
    };
    const otherPlayer = {
        isPlayer: true,
        name: 'Other player',
        hand: {cards: []},
    };
    mediaCard.attachedTo = {owner: player};
    await mediaCard.initTriggers();

    const resolutions = [];
    const makeAbility = name => ({
        card: {name},
        isWhenRevealed: true,
        isValidIdentity() {
            return true;
        },
        async resolveAbility(params) {
            resolutions.push({name, player: params.player, card: params.card});
            this.resolved = true;
        },
    });
    const firstAbility = makeAbility('first');
    const secondAbility = makeAbility('second');
    const revealedCard = {
        currentSide: {
            abilities: [
                firstAbility,
                secondAbility,
                {isWhenRevealed: false},
            ],
        },
    };
    const revealEffect = new RevealEncounterEffect({
        match,
        selectedTarget: revealedCard,
    });

    await revealEffect.reveal({player: otherPlayer});
    assert.equal(resolutions.length, 2);

    await revealEffect.reveal({player});
    assert.equal(resolutions.length, 6);
    assert.deepEqual(
        resolutions.slice(2).map(({name, player: resolvingPlayer}) => [
            name,
            resolvingPlayer,
        ]),
        [
            ['first', player],
            ['first', player],
            ['second', player],
            ['second', player],
        ]
    );

    const repeatAbility = mediaCard.abilities.find(ability =>
        ability.effect instanceof ResolveAbilityEffect);
    assert.ok(repeatAbility);
});

test('Impedimentos names the required resources in its discard dialog', async () => {
    const match = {triggerCards: {}, players: []};
    const factory = new CardsFactory({match});
    const schemeConfig = runningInterference.config.cards.find(({card}) =>
        card.params.name === 'Impedimentos').card;
    const scheme = factory.createGameCard({
        card: factory.createCard(schemeConfig),
        owner: {},
    });
    const [whenRevealed] = scheme.abilities;
    const [discardEffect, threatEffect] = whenRevealed.effect.options;
    const mentalResource = createHandCard('mental', [RESOURCE_MENTAL]);
    const physicalResource = createHandCard('physical', [RESOURCE_PHYSICAL]);
    const {player, discarded} = createPlayer([
        mentalResource,
        physicalResource,
    ]);
    let instruction;

    discardEffect.selectedTarget = player;
    discardEffect.openDialog = async ({data}) => {
        instruction = data.instruction;

        return {
            selected: [data.cards[0]],
        };
    };

    assert.equal(
        discardEffect.getTitle(),
        'Descarta recursos [m] y [p] de tu mano'
    );
    assert.equal(
        threatEffect.getTitle(),
        'Coloca 2 de Amenaza sobre esta carta'
    );

    await discardEffect.execute({match, player});

    assert.equal(instruction, 'Descarta recursos [m] y [p] de tu mano');
    assert.deepEqual(discarded, [mentalResource, physicalResource]);
    assert.deepEqual(player.hand.cards, []);
});

test('Tombstone forces a resource discard after attack damage reaches a superhero', async () => {
    const match = {triggerCards: {}, players: []};
    const factory = new CardsFactory({match});
    const tombstoneConfig = runningInterference.config.cards.find(({card}) =>
        card.params.name === 'Lápida').card;
    const tombstone = factory.createGameCard({
        card: factory.createCard(tombstoneConfig),
        owner: {},
    });
    const [forcedResponse] = tombstone.abilities;
    const makeDamageParams = (selectedTarget, player, damage) => {
        const attack = new Attack({
            effect: {
                character: tombstone,
                attacked: selectedTarget,
                selectedTarget,
            },
        });
        const effect = new TakeDamageEffect({
            activation: attack,
            damage,
            isAttack: true,
            match,
            selectedTarget,
        });

        return effect.getTriggersParams({match, player});
    };
    const resource = createHandCard('mental', [RESOURCE_MENTAL]);
    const {player, discarded} = createPlayer([resource]);
    Object.assign(player, {
        isPlayer: true,
        isSuperhero: true,
        name: 'RRR',
    });
    const damageParams = makeDamageParams(player, player, 3);
    const discardEffect = forcedResponse.effect.effect;

    assert.equal(damageParams.card, tombstone);
    assert.equal(damageParams.effect.takenDamage, 3);
    assert.equal(damageParams.attack.takenDamage, 0);
    assert.equal(await forcedResponse.canTrigger(damageParams), true);
    assert.ok(discardEffect instanceof SelectDiscardToFindCardEffect);
    let discardInstruction;
    discardEffect.openDialog = async ({data}) => {
        discardInstruction = data.instruction;

        return {
            selected: [data.cards[0]],
        };
    };

    await forcedResponse.resolveAbility(damageParams);

    assert.equal(
        discardInstruction,
        'Descarta un recurso [m] o [p] de tu mano'
    );
    assert.deepEqual(discarded, [resource]);
    assert.deepEqual(player.hand.cards, []);

    const allyResource = createHandCard('ally-mental', [RESOURCE_MENTAL]);
    const {player: allyPlayer, discarded: allyDiscarded} =
        createPlayer([allyResource]);
    Object.assign(allyPlayer, {
        isPlayer: true,
        isSuperhero: true,
        name: 'RRR',
    });
    const ally = {
        isAlly: true,
        isSuperhero: false,
        name: 'Ally',
    };
    const allyDamageParams = makeDamageParams(ally, allyPlayer, 3);

    assert.equal(await forcedResponse.canTrigger(allyDamageParams), true);
    await forcedResponse.resolveAbility(allyDamageParams);

    assert.deepEqual(allyDiscarded, []);
    assert.deepEqual(allyPlayer.hand.cards, [allyResource]);

    const noDamageParams = makeDamageParams(player, player, 0);
    assert.equal(await forcedResponse.canTrigger(noDamageParams), false);
});

test('Scorpion resolves its forced response from the damage effect context', async () => {
    const match = {triggerCards: {}, players: []};
    const factory = new CardsFactory({match});
    const scorpionConfig = aMessOfThings.config.cards.find(({card}) =>
        card.params.name === 'Escorpión').card;
    const scorpion = factory.createGameCard({
        card: factory.createCard(scorpionConfig),
        owner: {},
    });
    const [forcedResponse] = scorpion.abilities;
    const defender = {
        isInPlay: true,
        isStunned: false,
        name: 'Defender',
        refresh() {},
        stun() {
            this.isStunned = true;
        },
    };
    const player = createPlayer([]).player;
    const attack = new Attack({
        effect: {
            character: scorpion,
            attacked: defender,
            selectedTarget: defender,
        },
    });
    const damageEffect = new TakeDamageEffect({
        activation: attack,
        damage: 3,
        isAttack: true,
        match,
        selectedTarget: defender,
    });
    const params = damageEffect.getTriggersParams({match, player});

    assert.equal(params.effect.takenDamage, 3);
    assert.equal(params.attack.takenDamage, 0);
    assert.equal(await forcedResponse.canTrigger(params), true);
    await forcedResponse.resolveAbility(params);

    assert.equal(defender.isStunned, true);
});
