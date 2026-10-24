import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    DIALOG_BOOST_DEALT,
    DIALOG_USE_CARD,
    PRIORITY_RESPONSE,
    TRIGGER_BOOST_REVEALED,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Deck} from '../../src/model/match/deck.js';
import {Match} from '../../src/model/match/match.js';
import {CancelBoostIconsEffect} from '../../src/effects/cancel-boost-icons-effect.js';
import {ModifyBoostIconsEffect} from '../../src/effects/modify-boost-icons-effect.js';
import {ResolveBoostEffect} from '../../src/effects/resolve-boost-effect.js';

describe('ResolveBoostEffect', () => {
test('CancelBoostIconsEffect cancels all boost icons on the current card', async () => {
    const triggeredEffect = {
        boostValue: 5,
        card: {boost: 3},
        cancelledBoostIcons: 0,
    };
    const params = {
        player: {},
        triggeredEffect,
    };
    const effect = new CancelBoostIconsEffect({});

    assert.equal(await effect.canRun(params), true);
    effect.execute(params);

    assert.equal(triggeredEffect.boostValue, 0);
    assert.equal(triggeredEffect.cancelledBoostIcons, 5);
    assert.equal(params.cancelledBoostIcons, 5);
});

test('CancelBoostIconsEffect cannot cancel the same boost card twice', async () => {
    const triggeredEffect = {
        boostValue: 5,
        card: {boost: 3},
        cancelledBoostIcons: 0,
    };
    const params = {
        player: {},
        triggeredEffect,
    };
    const effect = new CancelBoostIconsEffect({});

    assert.equal(await effect.canRun(params), true);
    effect.execute(params);
    assert.equal(await effect.canRun(params), false);
    effect.execute(params);

    assert.equal(triggeredEffect.boostValue, 0);
    assert.equal(triggeredEffect.cancelledBoostIcons, 5);
    assert.equal(params.cancelledBoostIcons, 0);
});

test('CancelBoostIconsEffect can cancel amplification-generated icons without printed icons', async () => {
    const effect = new CancelBoostIconsEffect({});
    const triggeredEffect = {
        boostValue: 2,
        card: {boost: 0},
        cancelledBoostIcons: 0,
    };
    const params = {
        player: {},
        triggeredEffect,
    };

    assert.equal(await effect.canRun(params), true);
    effect.execute(params);
    assert.equal(triggeredEffect.boostValue, 0);
    assert.equal(triggeredEffect.cancelledBoostIcons, 2);
    assert.equal(params.cancelledBoostIcons, 2);
    assert.equal(await effect.canRun(params), false);
});

test('CancelBoostIconsEffect can only cancel boost icons that remain after earlier cancellations', async () => {
    const effect = new CancelBoostIconsEffect({});
    const triggeredEffect = {
        boostValue: 2,
        card: {boost: 3},
        cancelledBoostIcons: 1,
    };
    const params = {
        player: {},
        triggeredEffect,
    };

    assert.equal(await effect.canRun(params), true);
    effect.execute(params);
    assert.equal(triggeredEffect.boostValue, 0);
    assert.equal(triggeredEffect.cancelledBoostIcons, 3);
    assert.equal(params.cancelledBoostIcons, 2);
});

test('amplification icons add a boost icon to every boost card in the activation', async () => {
    const dialogs = [];
    const match = new Match({
        mc: {mcSocket: {send() {}}},
        name: 'amplification-icons-test',
    });
    match.scenario = {
        amplificationIcons: 2,
        deck: {knownCards: []},
    };
    match.openDialog = async dialog => dialogs.push(dialog);

    const boostCard = {
        boost: 1,
        toObj: () => ({name: 'Boost card'}),
        isMainScheme: false,
        isSideScheme: false,
    };
    const enemyActivation = {
        boostCards: [
            {...boostCard, boost: 2},
            boostCard,
        ],
        enemy: {name: 'Duende Verde'},
    };
    const effect = new ResolveBoostEffect({
        card: boostCard,
        cardIndex: 1,
        enemyActivation,
        match,
        previousBoost: 4,
        selectedTarget: {},
    });

    await effect.runEffect({player: {}});

    assert.equal(effect.value, 3);
    assert.equal(dialogs[0].data.cumulativeBoost, 7);
});

test('Objetivo fijado cancels a revealed boost ability before it resolves', async () => {
    const catalog = await loadCatalog();
    const objectiveDefinition = catalog.aspects.find(({_id}) =>
        _id === 'basic-objetivo-fijado');
    assert.ok(objectiveDefinition);
    const dialogs = [];
    const match = new Match({
        mc: {mcSocket: {send() {}}},
        name: 'objetivo-fijado-boost-test',
    });
    match.scenario = {amplificationIcons: 0};
    match.openDialog = async dialog => {
        dialogs.push(dialog);
        if (dialog.dialogType === DIALOG_USE_CARD) {
            return {selected: {id: objectiveCard.id}};
        }
    };

    const matchFactory = new MatchFactory(match);
    const player = {
        amplificationIcons: 0,
        hand: {cards: []},
        isHero: true,
        isPlayer: true,
        upgrades: [],
    };
    match.players.push(player);
    const objectiveCard = matchFactory.cardsFactory.createGameCard({
        card: matchFactory.cardsFactory.createCard(objectiveDefinition.card),
        owner: player,
    });
    objectiveCard.controller = player;
    player.upgrades.push(objectiveCard);
    await objectiveCard.initTriggers({player});

    const objectiveAbility = objectiveCard.abilities[0];
    assert.equal(objectiveAbility.trigger, TRIGGER_BOOST_REVEALED);
    assert.ok(
        objectiveCard.triggers[TRIGGER_BOOST_REVEALED][PRIORITY_RESPONSE].length
    );
    objectiveAbility.costs.canPay = async () => true;
    objectiveAbility.payCosts = async () => true;

    let boostAbilityResolved = false;
    const boostCard = {
        boost: 1,
        boostAbility: {
            async resolveAbility() {
                boostAbilityResolved = true;
            },
        },
        isMainScheme: false,
        isSideScheme: false,
        toObj() {
            return {name: 'Boost card', boost: this.boost};
        },
    };
    const boostEffect = new ResolveBoostEffect({
        card: boostCard,
        enemyActivation: {boostCards: [boostCard]},
        match,
    });
    assert.equal(boostEffect.hasBoostAbility, true);
    assert.equal(
        await objectiveAbility.canRun(
            boostEffect.getTriggersParams({player})
        ),
        true
    );
    const boostWithoutAbility = new ResolveBoostEffect({
        card: {
            boost: 1,
            isMainScheme: false,
            isSideScheme: false,
            toObj() {
                return {name: 'Boost card without ability', boost: this.boost};
            },
        },
        enemyActivation: {boostCards: []},
        match,
    });
    assert.equal(boostWithoutAbility.hasBoostAbility, false);
    assert.equal(
        await objectiveAbility.canRun(
            boostWithoutAbility.getTriggersParams({player})
        ),
        false
    );

    await boostEffect.runEffect({player});

    const responseDialog = dialogs.find(({dialogType}) =>
        dialogType === DIALOG_USE_CARD);
    assert.ok(responseDialog);
    assert.equal(
        responseDialog.title,
        '¿Quieres usar alguna Respuesta?'
    );
    assert.equal(responseDialog.data.cards[0].name, 'Objetivo fijado');
    assert.equal(boostAbilityResolved, false);
    assert.equal(boostEffect.cancelledBoostAbility, true);
    assert.equal(boostEffect.value, 1);
});

test('a boost ability reopens the multi-card dialog with its updated icon count', async () => {
    const dialogs = [];
    const boostCard = {
        boost: 1,
        boostAbility: {
            async resolveAbility({effect}) {
                await new ModifyBoostIconsEffect({
                    count: 1,
                    selectedTarget: effect,
                }).execute({});
            },
        },
        isMainScheme: false,
        isSideScheme: false,
        toObj() {
            return {boost: this.boost, name: 'Aumento con icono modificado'};
        },
    };
    const futureBoostCard = {
        toObj() {
            return {name: 'Próxima carta de aumento', boost: 2};
        },
        isMainScheme: false,
        isSideScheme: false,
    };
    const enemyActivation = {
        boostCards: [
            boostCard,
            futureBoostCard,
        ],
        enemy: {name: 'Klaw'},
    };
    const match = {
        amplificationIcons: 0,
        scenario: {deck: {knownCards: []}},
        async openDialog(dialog) {
            dialogs.push(dialog);
        },
    };
    const effect = new ResolveBoostEffect({
        card: boostCard,
        cardIndex: 0,
        enemyActivation,
        match,
        selectedTarget: {},
    });

    await effect.prepare({});
    await effect.execute({});

    assert.deepEqual(dialogs.map(({dialogType}) => dialogType), [
        DIALOG_BOOST_DEALT,
        DIALOG_BOOST_DEALT,
    ]);
    assert.equal(dialogs[0].title, 'Aumento 1/2');
    assert.equal(dialogs[1].title, 'Aumento actualizado');
    assert.equal(dialogs[0].subtitle, undefined);
    assert.equal(
        dialogs[1].subtitle,
        'Se muestran los iconos de aumento actualizados.'
    );
    assert.equal(dialogs[0].data.cards[0].card.boost, 1);
    assert.equal(dialogs[0].data.cards[1].card.isFacedownCard, true);
    assert.equal(dialogs[0].data.cards[1].card.canPeekFacedown, false);
    assert.equal(dialogs[0].data.cumulativeBoost, 1);
    assert.equal(dialogs[1].data.cards[0].card.boost, 2);
    assert.equal(dialogs[1].data.cumulativeBoost, 2);
});

test('future boost cards can only be peeked after they are known in the encounter deck', async () => {
    const dialogs = [];
    const currentBoost = {
        name: 'Aumento actual',
        boost: 1,
        isMainScheme: false,
        isSideScheme: false,
        toObj() {
            return {name: this.name, boost: this.boost};
        },
    };
    const knownFutureBoost = {
        name: 'Aumento conocido',
        boost: 2,
        isMainScheme: false,
        isSideScheme: false,
        toObj() {
            return {name: this.name, boost: this.boost};
        },
    };
    const unknownFutureBoost = {
        name: 'Aumento desconocido',
        boost: 3,
        isMainScheme: false,
        isSideScheme: false,
        toObj() {
            return {name: this.name, boost: this.boost};
        },
    };
    const match = {
        amplificationIcons: 0,
        async openDialog(dialog) {
            dialogs.push(dialog);
        },
    };
    const encounterDeck = new Deck({owner: {match}});
    encounterDeck.cards = [
        currentBoost,
        knownFutureBoost,
        unknownFutureBoost,
    ];
    encounterDeck.markKnown([knownFutureBoost]);
    match.scenario = {deck: encounterDeck};

    const enemyActivation = {
        boostCards: [
            currentBoost,
            knownFutureBoost,
            unknownFutureBoost,
        ],
        enemy: {name: 'Klaw'},
    };
    const effect = new ResolveBoostEffect({
        card: currentBoost,
        cardIndex: 0,
        enemyActivation,
        match,
        selectedTarget: {},
    });

    await effect.prepare({});

    assert.equal(dialogs.length, 1);
    assert.equal(dialogs[0].data.cards[1].card.isFacedownCard, true);
    assert.equal(dialogs[0].data.cards[1].card.canPeekFacedown, true);
    assert.equal(dialogs[0].data.cards[2].card.isFacedownCard, true);
    assert.equal(dialogs[0].data.cards[2].card.canPeekFacedown, false);
});
});
