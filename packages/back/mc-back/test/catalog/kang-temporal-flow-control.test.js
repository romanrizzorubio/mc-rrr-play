import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    CARD_TYPE_EVENT,
    CARD_TYPE_RESOURCE,
    CARD_TYPE_TREACHERY,
    DIALOG_DISCARD_ORDER,
    EFFECT_CHAINED,
    EFFECT_DISCARD_CONDITION_HAND,
    EFFECT_DO_IF,
    EFFECT_SURGE,
    RESOURCE_PHYSICAL,
    TARGET_YOU,
} from 'mc-shared';
import blackPanther from '../../../mc-data/seed/catalog/heroes/blackpanther.js';
import kang from '../../../mc-data/seed/catalog/scenarios/kang.js';
import {RevealEncounterEffect} from '../../src/effects/reveal-encounter-effect.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';

const createGame = async () => {
    const match = new Match({
        mc: {mcSocket: {send() {}}},
        name: 'kang-temporal-flow-control-test',
    });
    match.persist = async () => {};
    match.refresh = async () => {};
    match.openDialog = async dialog =>
        dialog.dialogType === DIALOG_DISCARD_ORDER ?
            {selected: dialog.data.cards} :
            {};

    const factory = new MatchFactory(match);
    const superhero = factory.createSuperhero({
        ...blackPanther.config,
        cards: [],
        precon: [],
        nemesis: [],
        obligation: undefined,
    });
    superhero.selectedSide = 1;
    const player = match.createPlayer({
        name: 'Jugador',
        initial: true,
        superhero,
    });
    player.initPlayer();
    match.currentPlayer = player;
    match.currentTurnPlayer = player;

    const scenarioConfig = structuredClone(kang.config);
    scenarioConfig.sets = [];
    scenarioConfig.defaultSets = [];
    scenarioConfig.mainSchemes[0][0] = {
        ...scenarioConfig.mainSchemes[0][0],
        params: {
            ...scenarioConfig.mainSchemes[0][0].params,
            abilities: [],
        },
    };
    const scenario = await factory.createScenario(scenarioConfig);
    match.addScenario(scenario);
    await scenario.initScenario([], false);

    const temporalFlowControl = scenario.deck.cards.find(card =>
        card.name === 'Manipular el flujo temporal');

    return {factory, match, player, scenario, temporalFlowControl};
};

const createHandCard = (factory, player, type, name) =>
    factory.cardsFactory.createGameCardFromConfig({
        type,
        params: {
            name,
            set: 'test',
            ...(type === CARD_TYPE_RESOURCE ?
                {resources: [RESOURCE_PHYSICAL]} :
                {}),
        },
    }, {owner: player});

const reveal = async (match, card, player) => {
    const revealEffect = new RevealEncounterEffect({card, match, player});
    await revealEffect.runEffect({player});

    return revealEffect;
};

describe('Manipular el flujo temporal', () => {
    test('is a one-copy Kang treachery with a runnable When Revealed effect', async () => {
        const entry = kang.config.cards.find(({card}) =>
            card.params.name === 'Manipular el flujo temporal');
        assert.equal(entry.count, 1);
        assert.equal(entry.card.type, CARD_TYPE_TREACHERY);
        assert.equal(entry.card.params.set, 'kang');
        assert.equal(entry.card.params.image, 'scenarios/kang/11027.png');
        assert.equal(entry.card.params.boost, 2);

        const images = kang.config.cards.map(({card}) => card.params.image);
        assert.deepEqual(images, images.toSorted());

        const {scenario, temporalFlowControl} = await createGame();
        assert.ok(temporalFlowControl);
        assert.equal(
            scenario.deck.cards.filter(card =>
                card.name === 'Manipular el flujo temporal').length,
            1
        );
        const whenRevealed = temporalFlowControl.abilities.find(ability =>
            ability.isWhenRevealed);
        assert.ok(whenRevealed);
        assert.ok(whenRevealed.effect);
        assert.equal(typeof whenRevealed.effect.canRun, 'function');
        assert.equal(whenRevealed.effect.effectType, EFFECT_CHAINED);

        const discard = whenRevealed.effect.effects[0];
        assert.equal(discard.effectType, EFFECT_DISCARD_CONDITION_HAND);
        assert.equal(discard.target, TARGET_YOU);
        assert.deepEqual(discard.condition, {isEvent: true});

        const surgeIfNoDiscard = whenRevealed.effect.effects[1];
        assert.equal(surgeIfNoDiscard.effectType, EFFECT_DO_IF);
        assert.deepEqual(
            surgeIfNoDiscard.condition,
            {'effects.0.resolved': false}
        );
        assert.equal(surgeIfNoDiscard.effect.effectType, EFFECT_SURGE);
    });

    test('discards every Event from the resolving player’s hand without gaining Surge', async () => {
        const {factory, match, player, temporalFlowControl} =
            await createGame();
        const events = [
            createHandCard(factory, player, CARD_TYPE_EVENT, 'Evento 1'),
            createHandCard(factory, player, CARD_TYPE_EVENT, 'Evento 2'),
        ];
        const resource = createHandCard(
            factory,
            player,
            CARD_TYPE_RESOURCE,
            'Recurso'
        );
        player.deck.cards.push(createHandCard(
            factory,
            player,
            CARD_TYPE_RESOURCE,
            'Carta del mazo'
        ));
        player.hand.cards = [...events, resource];

        const revealEffect = await reveal(match, temporalFlowControl, player);

        assert.equal(revealEffect.surge, false);
        assert.deepEqual(player.hand.cards, [resource]);
        events.forEach(event =>
            assert.ok(player.deck.discardPile.includes(event)));
        assert.equal(player.deck.discardPile.includes(resource), false);
    });

    test('gains Surge when no Event is discarded and leaves other hand cards alone', async () => {
        const {factory, match, player, scenario, temporalFlowControl} =
            await createGame();
        const resource = createHandCard(
            factory,
            player,
            CARD_TYPE_RESOURCE,
            'Recurso'
        );
        player.hand.cards = [resource];

        const surgeCard = factory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_TREACHERY,
            params: {
                name: 'Perfidia de Oleada',
                set: 'test',
                boost: 0,
            },
        }, {owner: scenario});
        scenario.deck.cards = [surgeCard];

        const revealEffect = await reveal(match, temporalFlowControl, player);

        assert.equal(revealEffect.surge, true);
        assert.deepEqual(player.hand.cards, [resource]);
        assert.ok(scenario.deck.discardPile.includes(surgeCard));
    });
});
