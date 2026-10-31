import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    CARD_TYPE_ALLY,
    CARD_TYPE_RESOURCE,
    CARD_TYPE_SUPPORT,
    CARD_TYPE_TREACHERY,
    DIALOG_LIST,
    DIALOG_SELECT_TARGET,
    EFFECT_CHAINED,
    EFFECT_DISCARD_GAME,
    EFFECT_DO_IF,
    EFFECT_ENEMY_ATTACK,
    EFFECT_SURGE,
    TARGET_ALLY_YOU_CONTROL,
    TARGET_SUPPORT_YOU_CONTROL,
} from 'mc-shared';
import blackPanther from '../../../mc-data/seed/catalog/heroes/blackpanther.js';
import kang from '../../../mc-data/seed/catalog/scenarios/kang.js';
import standard from '../../../mc-data/seed/catalog/sets/standard.js';
import {RevealEncounterEffect} from '../../src/effects/reveal-encounter-effect.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';

const createGame = async (side = 0, selectedCardId) => {
    const match = new Match({
        mc: {mcSocket: {send() {}}},
        name: 'kang-energy-ray-test',
    });
    match.persist = async () => {};
    match.refresh = async () => {};

    const dialogs = [];
    match.openDialog = async dialog => {
        dialogs.push(dialog);
        if (dialog.dialogType === DIALOG_SELECT_TARGET && selectedCardId) {
            return {selected: {id: selectedCardId}};
        }
        if (dialog.dialogType === DIALOG_LIST) {
            return {selected: {id: 0}};
        }

        return {};
    };

    const factory = new MatchFactory(match);
    const superhero = factory.createSuperhero({
        ...blackPanther.config,
        cards: [],
        precon: [],
        nemesis: [],
        obligation: undefined,
    });
    superhero.selectedSide = side;
    const player = match.createPlayer({
        name: 'Jugador',
        initial: true,
        superhero,
    });
    player.initPlayer();
    match.currentPlayer = player;
    match.currentTurnPlayer = player;

    const scenarioConfig = structuredClone(kang.config);
    scenarioConfig.cards.push(...structuredClone(standard.config.cards));
    scenarioConfig.sets = [];
    scenarioConfig.defaultSets = [];
    const scenario = await factory.createScenario(scenarioConfig);
    match.addScenario(scenario);
    await scenario.initScenario([], false);
    match.playing = true;
    match.phase = 'players';

    const energyRay = scenario.deck.cards.find(card =>
        card.name === 'Rayo de energía');

    return {dialogs, energyRay, factory, match, player, scenario};
};

const createPlayerCard = (factory, player, type, name) =>
    factory.cardsFactory.createGameCardFromConfig({
        type,
        params: {name, hitPoints: 2},
    }, {owner: player});

const putInPlay = (player, card) => {
    card.controller = player;
    player.gameZone.addToGameZone(card);
};

const reveal = async (match, card, player) => {
    const revealEffect = new RevealEncounterEffect({card, match, player});
    await revealEffect.runEffect({player});

    return revealEffect;
};

describe('Rayo de energía', () => {
    test('is a two-copy Kang treachery with runnable identity abilities', async () => {
        const entry = kang.config.cards.find(({card}) =>
            card.params.name === 'Rayo de energía');
        assert.equal(entry.count, 2);
        assert.equal(entry.card.type, CARD_TYPE_TREACHERY);
        assert.equal(entry.card.params.set, 'kang');
        assert.equal(entry.card.params.image, 'scenarios/kang/11026.png');
        assert.equal(entry.card.params.boost, 1);

        const images = kang.config.cards.map(({card}) => card.params.image);
        assert.deepEqual(images, images.toSorted());

        const {energyRay, scenario} = await createGame();
        assert.ok(energyRay);
        assert.equal(
            scenario.deck.cards.filter(card =>
                card.name === 'Rayo de energía').length,
            2
        );
        assert.ok(energyRay.abilities.every(ability =>
            ability.effect &&
            typeof ability.effect.canRun === 'function'));

        const [alterEgoAbility, heroAbility] = energyRay.abilities.filter(
            ability => ability.isWhenRevealed
        );
        assert.equal(alterEgoAbility.effect.effectType, EFFECT_CHAINED);
        assert.equal(
            alterEgoAbility.effect.effects[0].effectType,
            EFFECT_DISCARD_GAME
        );
        assert.deepEqual(alterEgoAbility.effect.effects[0].target, [
            TARGET_ALLY_YOU_CONTROL,
            TARGET_SUPPORT_YOU_CONTROL,
        ]);
        assert.equal(
            alterEgoAbility.effect.effects[1].effectType,
            EFFECT_DO_IF
        );
        assert.equal(
            alterEgoAbility.effect.effects[1].effect.effectType,
            EFFECT_SURGE
        );
        assert.equal(heroAbility.effect.effectType, EFFECT_ENEMY_ATTACK);
    });

    test('discards one Ally or Support controlled by the player in alter-ego form', async () => {
        const {dialogs, energyRay, factory, match, player} =
            await createGame(0);
        const firstAlly = createPlayerCard(
            factory,
            player,
            CARD_TYPE_ALLY,
            'Primer Aliado'
        );
        const selectedAlly = createPlayerCard(
            factory,
            player,
            CARD_TYPE_ALLY,
            'Aliado elegido'
        );
        const firstSupport = createPlayerCard(
            factory,
            player,
            CARD_TYPE_SUPPORT,
            'Primer Apoyo'
        );
        const secondSupport = createPlayerCard(
            factory,
            player,
            CARD_TYPE_SUPPORT,
            'Segundo Apoyo'
        );
        player.deck.cards.push(factory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_RESOURCE,
            params: {name: 'Carta en el mazo'},
        }, {owner: player}));
        [firstAlly, selectedAlly, firstSupport, secondSupport].forEach(card =>
            putInPlay(player, card));
        match.openDialog = async dialog => {
            dialogs.push(dialog);
            return dialog.dialogType === DIALOG_SELECT_TARGET ?
                {selected: {id: selectedAlly.id}} :
                {};
        };

        const revealEffect = await reveal(match, energyRay, player);

        const targetDialog = dialogs.find(dialog =>
            dialog.dialogType === DIALOG_SELECT_TARGET);
        assert.ok(targetDialog);
        assert.deepEqual(
            targetDialog.data.cards.map(card => card.name).sort(),
            [
                'Aliado elegido',
                'Primer Aliado',
                'Primer Apoyo',
                'Segundo Apoyo',
            ]
        );
        assert.equal(player.gameZone.cards.includes(firstAlly), true);
        assert.equal(player.gameZone.cards.includes(selectedAlly), false);
        assert.equal(player.gameZone.cards.includes(firstSupport), true);
        assert.equal(player.gameZone.cards.includes(secondSupport), true);
        assert.ok(player.deck.discardPile.includes(selectedAlly));
        assert.equal(revealEffect.surge, false);
    });

    test('discards a Support chosen by the player in alter-ego form', async () => {
        const {energyRay, factory, match, player} = await createGame(0);
        const ally = createPlayerCard(
            factory,
            player,
            CARD_TYPE_ALLY,
            'Aliado en juego'
        );
        const support = createPlayerCard(
            factory,
            player,
            CARD_TYPE_SUPPORT,
            'Apoyo elegido'
        );
        player.deck.cards.push(factory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_RESOURCE,
            params: {name: 'Carta en el mazo'},
        }, {owner: player}));
        [ally, support].forEach(card => putInPlay(player, card));
        match.openDialog = async dialog =>
            dialog.dialogType === DIALOG_SELECT_TARGET ?
                {selected: {id: support.id}} :
                {};

        const revealEffect = await reveal(match, energyRay, player);

        assert.equal(player.gameZone.cards.includes(ally), true);
        assert.equal(player.gameZone.cards.includes(support), false);
        assert.ok(player.deck.discardPile.includes(support));
        assert.equal(revealEffect.surge, false);
    });

    test('gains Surge in alter-ego form when no controlled Ally or Support can be discarded', async () => {
        const {energyRay, factory, match, player, scenario} =
            await createGame(0);
        const surgeCard = factory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_TREACHERY,
            params: {
                name: 'Perfidia de prueba',
                set: 'test',
                boost: 0,
            },
        }, {owner: scenario});
        scenario.deck.cards = [surgeCard];

        const revealEffect = await reveal(match, energyRay, player);

        assert.equal(revealEffect.surge, true);
        assert.ok(scenario.deck.discardPile.includes(surgeCard));
    });

    test('Kang attacks the player when revealed in hero form', async () => {
        const {energyRay, match, player} = await createGame(1);
        const startingDamage = player.superhero.damage;

        await reveal(match, energyRay, player);

        assert.ok(player.superhero.damage > startingDamage);
    });
});
