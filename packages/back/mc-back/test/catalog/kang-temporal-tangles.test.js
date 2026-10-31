import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    CARD_TYPE_OBLIGATION,
    CARD_TYPE_RESOURCE,
    CARD_TYPE_SUPPORT,
    DIALOG_DISCARD_HAND,
    DIALOG_SELECT_TARGET,
    EFFECT_CHAINED,
    EFFECT_DISCARD_GAME,
    EFFECT_TUCK_UNDER,
    RESOURCE_ENERGY,
    RESOURCE_PHYSICAL,
    TRAIT_TEMPORAL,
} from 'mc-shared';
import blackPanther from '../../../mc-data/seed/catalog/heroes/blackpanther.js';
import kang from '../../../mc-data/seed/catalog/scenarios/kang.js';
import standard from '../../../mc-data/seed/catalog/sets/standard.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';
import {RevealEncounterEffect} from '../../src/effects/reveal-encounter-effect.js';

const createGame = async ({selectedCardId} = {}) => {
    const match = new Match({
        mc: {mcSocket: {send() {}}},
        name: 'kang-temporal-tangles-test',
    });
    match.persist = async () => {};
    match.refresh = async () => {};

    const dialogs = [];
    match.openDialog = async dialog => {
        dialogs.push(dialog);
        if (dialog.dialogType === DIALOG_SELECT_TARGET && selectedCardId) {
            return {selected: {id: selectedCardId}};
        }
        if (dialog.dialogType === DIALOG_DISCARD_HAND) {
            return {
                selected: dialog.data.cards.map(({id}) => ({id})),
            };
        }

        return {};
    };

    const factory = new MatchFactory(match);
    const player = match.createPlayer({
        name: 'Jugador',
        initial: true,
        superhero: factory.createSuperhero({
            ...blackPanther.config,
            cards: [],
            precon: [],
            nemesis: [],
            obligation: undefined,
        }),
    });
    player.initPlayer();
    player.superhero.selectedSide = 0;
    match.currentPlayer = player;
    match.currentTurnPlayer = player;

    const scenario = await factory.createScenario({
        ...structuredClone(kang.config),
        cards: structuredClone([...kang.config.cards, ...standard.config.cards]),
        sets: [],
        defaultSets: [],
    });
    match.addScenario(scenario);
    await scenario.initScenario([], false);
    match.playing = true;
    match.phase = 'players';

    const obligation = scenario.deck.cards.find(card =>
        card.name === 'Enredos temporales');

    return {dialogs, factory, match, obligation, player, scenario};
};

const createSupport = (factory, owner, name, cost) =>
    factory.cardsFactory.createGameCardFromConfig({
        type: CARD_TYPE_SUPPORT,
        params: {name, cost},
    }, {owner});

const putInPlay = (player, card) => {
    card.controller = player;
    player.gameZone.addToGameZone(card);
};

const revealObligation = async ({match, obligation, player}) =>
    new RevealEncounterEffect({
        card: obligation,
        match,
        player,
    }).runEffect({player});

describe('Enredos temporales', () => {
    test('is a two-copy Kang Obligation with a Temporal trait and runnable abilities', async () => {
        const entry = kang.config.cards.find(({card}) =>
            card.params.name === 'Enredos temporales');
        assert.equal(entry.count, 2);
        assert.equal(entry.card.type, CARD_TYPE_OBLIGATION);
        assert.equal(entry.card.params.set, 'kang');
        assert.equal(entry.card.params.image, 'scenarios/kang/11021.png');
        assert.deepEqual(entry.card.params.traits, [TRAIT_TEMPORAL]);
        assert.equal(entry.card.params.keywords, undefined);
        assert.equal(entry.card.params.boost, 2);

        const images = kang.config.cards.map(({card}) => card.params.image);
        assert.deepEqual(images, images.toSorted());

        const {obligation, scenario} = await createGame();
        assert.equal(scenario.scenarioCards.filter(card =>
            card.name === 'Enredos temporales').length, 2);
        assert.ok(obligation.abilities.every(ability =>
            ability.effect &&
            typeof ability.effect.canRun === 'function'));

        const whenRevealed = obligation.abilities.find(ability =>
            ability.isWhenRevealed);
        assert.equal(whenRevealed.effect.effectType, EFFECT_CHAINED);
        assert.equal(
            whenRevealed.effect.effects[0].effectType,
            EFFECT_DISCARD_GAME
        );
        assert.equal(
            whenRevealed.effect.thenEffect.effectType,
            EFFECT_TUCK_UNDER
        );
        const alterEgoAction = obligation.abilities.find(ability =>
            ability.isAction);
        assert.ok(alterEgoAction);
        assert.equal(
            alterEgoAction.name,
            'Descarta un recurso [e] de tu mano → descarta esta Obligación.'
        );
        assert.equal(
            obligation.toObj().abilities.find(ability => ability.isAction).name,
            alterEgoAction.name
        );
    });

    test('discards one highest-cost player card, then tucks that same card under the Obligation', async () => {
        const {dialogs, factory, match, obligation, player} =
            await createGame();
        const chosenHighest = createSupport(
            factory,
            player,
            'Apoyo de mayor coste elegido',
            5
        );
        const tiedHighest = createSupport(
            factory,
            player,
            'Apoyo de mayor coste empatado',
            5
        );
        const lowerCost = createSupport(
            factory,
            player,
            'Apoyo de menor coste',
            3
        );
        [chosenHighest, tiedHighest, lowerCost].forEach(card =>
            putInPlay(player, card));
        match.openDialog = async dialog => {
            dialogs.push(dialog);
            return {selected: {id: chosenHighest.id}};
        };

        await revealObligation({match, obligation, player});

        const targetDialog = dialogs.find(dialog =>
            dialog.dialogType === DIALOG_SELECT_TARGET);
        assert.ok(targetDialog);
        assert.deepEqual(
            targetDialog.data.cards.map(card => card.name).sort(),
            [
                'Apoyo de mayor coste elegido',
                'Apoyo de mayor coste empatado',
            ]
        );
        assert.equal(obligation.controller, player);
        assert.equal(obligation.tuckedCards.length, 1);
        assert.strictEqual(obligation.tuckedCards[0], chosenHighest);
        assert.equal(obligation.faceDown.length, 0);
        assert.equal(player.gameZone.cards.includes(chosenHighest), false);
        assert.equal(player.deck.discardPile.includes(chosenHighest), false);
        assert.ok(player.gameZone.cards.includes(tiedHighest));
        assert.ok(player.gameZone.cards.includes(lowerCost));
        assert.equal(chosenHighest.isInPlay, false);
    });

    test('does not count the encounter Obligation itself when no player card is in play', async () => {
        const {match, obligation, player} = await createGame();

        await revealObligation({match, obligation, player});

        assert.ok(player.gameZone.cards.includes(obligation));
        assert.equal(obligation.tuckedCards.length, 0);
        assert.equal(obligation.faceDown.length, 0);
    });

    test('its alter-ego action discards an Energy resource from hand and then discards the Obligation', async () => {
        const {dialogs, factory, match, obligation, player, scenario} =
            await createGame();
        await revealObligation({match, obligation, player});

        const energy = factory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_RESOURCE,
            params: {
                name: 'Recurso de energía',
                resources: [RESOURCE_ENERGY],
            },
        }, {owner: player});
        const physical = factory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_RESOURCE,
            params: {
                name: 'Recurso físico',
                resources: [RESOURCE_PHYSICAL],
            },
        }, {owner: player});
        player.hand.addCards([energy, physical]);
        player.deck.cards.push(factory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_RESOURCE,
            params: {name: 'Carta restante del mazo'},
        }, {owner: player}));

        const action = obligation.abilities.find(ability => ability.isAction);
        assert.equal(player.isAlterEgo, true);

        await action.resolveAbility({card: obligation, match, player});

        const paymentDialog = dialogs.find(dialog =>
            dialog.dialogType === DIALOG_DISCARD_HAND);
        assert.ok(paymentDialog);
        assert.deepEqual(
            paymentDialog.data.cards.map(card => card.name),
            ['Recurso de energía']
        );
        assert.ok(player.deck.discardPile.includes(energy));
        assert.ok(player.hand.cards.includes(physical));
        assert.equal(player.gameZone.cards.includes(obligation), false);
        assert.ok(scenario.deck.discardPile.includes(obligation));
    });
});
