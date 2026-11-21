import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    CARD_TYPE_ALLY,
    CARD_TYPE_RESOURCE,
    CARD_TYPE_TREACHERY,
    CARD_TYPE_UPGRADE,
    DIALOG_DISCARD_ORDER,
    DIALOG_LIST,
    DIALOG_PAY_COST,
    DIALOG_USE_CARD,
    EFFECT_CHOOSE,
    EFFECT_DISCARD_GAME,
    MATCH_END_REASON_SCENARIO_FAILED,
    RESOURCE_MENTAL,
    TARGET_CARD,
    TARGET_SOURCE,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import sheHulk from '../../../mc-data/seed/catalog/heroes/she-hulk.js';
import {DefeatEffect} from '../../src/effects/defeat-effect.js';
import {DiscardFromGameEffect} from '../../src/effects/discard-from-game-effect.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {MoveCountersEffect} from '../../src/effects/move-counters-effect.js';
import {RemoveCountersEffect} from '../../src/effects/remove-counters-effect.js';
import {Match} from '../../src/model/match/match.js';
import {restoreMatch, serializeMatch} from '../../src/utils/match-serialization.js';

const SET = 'infiltrate-the-museum';

async function createScenario(deckCardNames = []) {
    const {scenarios, sets} = await loadCatalog();
    const scenarioRecord = scenarios.find(({_id}) => _id === SET);
    assert.ok(scenarioRecord);

    const setConfigs = new Map(sets.map(({_id, config}) => [_id, config]));
    const match = new Match({
        mc: {
            data: {
                async getSetConfig(id) {
                    const config = setConfigs.get(id);
                    assert.ok(config, `Missing test set "${id}".`);
                    return config;
                },
            },
            mcSocket: {send() {}},
        },
        name: `${SET}-test`,
    });
    match.persist = async () => {};
    match.refresh = async () => {};
    match.openDialog = async ({data, dialogType}) => {
        if (dialogType === DIALOG_USE_CARD) {
            return {selected: data.cards[0]};
        }
        if (dialogType === DIALOG_LIST && data.options?.length) {
            return {selected: data.options[0]};
        }

        return {};
    };

    const factory = new MatchFactory(match);
    const superhero = factory.createSuperhero({
        ...structuredClone(sheHulk.config),
        cards: [],
        nemesis: [],
        obligation: undefined,
        precon: [],
    });
    const player = match.createPlayer({
        initial: true,
        name: 'Jugador',
        superhero,
    });
    player.initPlayer();
    player.deck.cards = deckCardNames.map(name =>
        factory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_RESOURCE,
            params: {
                name,
                set: 'test',
                resources: [RESOURCE_MENTAL],
            },
        }, {owner: player}));

    const scenario = await factory.createScenario(scenarioRecord.config);
    match.addScenario(scenario);

    return {factory, match, player, scenario, scenarioRecord};
}

describe('Infiltrados en el museo', () => {
    test('catalog defines normal and expert villains, scheme, and required sets', async () => {
        const {scenarioRecord} = await createScenario();

        assert.equal(scenarioRecord.name, 'Infiltrados en el museo');
        assert.deepEqual(
            scenarioRecord.config.villains.map(({params}) => params.stage),
            [1, 2]
        );
        assert.deepEqual(
            scenarioRecord.config.expertVillains.map(({params}) => params.stage),
            [2, 3]
        );
        assert.deepEqual(scenarioRecord.config.sets, [
            'standard',
            'galactic-artifacts',
        ]);
        assert.deepEqual(scenarioRecord.config.defaultSets, ['menagerie-medley']);
        assert.deepEqual(scenarioRecord.config.cards, []);
        assert.deepEqual(
            scenarioRecord.config.additionalZones.map(({id, name, displayCardInfo}) => [
                id,
                name,
                displayCardInfo.map(({id, label, path}) => [id, label, path]),
            ]),
            [[
                'collection',
                'La Colección',
                [['owner', 'Propietario', 'owner.name']],
            ]]
        );
        assert.equal(
            scenarioRecord.config.mainSchemes[0][1].params.value[0],
            10
        );
    });

    test('main scheme setup places each player deck top card face up in the Collection', async () => {
        const {match, player, scenario} = await createScenario([
            'Carta superior',
            'Carta restante',
        ]);

        await scenario.initScenario(match.createObligations(), false);

        assert.deepEqual(
            scenario.additionalZones.collection.cards.map(card => card.name),
            ['Carta superior']
        );
        assert.equal(scenario.additionalZones.collection.cards[0].owner, player);
        assert.deepEqual(
            player.deck.cards.map(card => card.name),
            ['Carta restante']
        );
        assert.equal(
            scenario.toObj().additionalZones.collection.cards[0]
                .additionalInfo.owner,
            player.name
        );
    });

    test('expert setup resolves the initial stage II When Revealed ability', async () => {
        const {match, player, scenario} = await createScenario([
            'Carta de preparación',
            'Carta elegida',
            'Carta restante',
        ]);

        await scenario.initScenario(match.createObligations(), true);
        await match.resolveWhenReveal(player);

        assert.equal(scenario.gameZone.currentVillain.stage, 2);
        assert.deepEqual(
            scenario.additionalZones.collection.cards.map(card => card.name),
            ['Carta de preparación', 'Carta elegida']
        );
        assert.deepEqual(
            player.deck.cards.map(card => card.name),
            ['Carta restante']
        );
    });

    test('stage II and III reveal effects add cards and stage III adds matching threat', async () => {
        const {match, player, scenario} = await createScenario([
            'Carta uno',
            'Carta dos',
            'Carta tres',
            'Carta restante',
        ]);
        scenario.expertVillains = [
            scenario.villains[0],
            scenario.villains[1],
            scenario.expertVillains[1],
        ];

        await scenario.initScenario(match.createObligations(), true);

        assert.equal(scenario.gameZone.currentVillain.stage, 1);
        assert.equal(scenario.additionalZones.collection.cards.length, 1);

        await scenario.selectVillain(
            player,
            scenario.gameZone.currentVillain,
            {defeatAnnounced: true}
        );

        assert.equal(scenario.gameZone.currentVillain.stage, 2);
        assert.equal(scenario.additionalZones.collection.cards.length, 2);

        await scenario.selectVillain(
            player,
            scenario.gameZone.currentVillain,
            {defeatAnnounced: true}
        );

        assert.equal(scenario.gameZone.currentVillain.stage, 3);
        assert.equal(scenario.additionalZones.collection.cards.length, 3);
        assert.equal(scenario.gameZone.currentScheme.currentSide.threat, 7);
    });

    test('an in-play card goes to the Collection and can later be discarded to its owner pile', async () => {
        const {factory, match, player, scenario} = await createScenario([
            'Carta del jugador',
            'Carta restante',
        ]);

        await scenario.initScenario(match.createObligations(), false);

        const encounterCard = factory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_TREACHERY,
            params: {
                name: 'Carta de encuentro',
                set: SET,
                image: `scenarios/${SET}/test.png`,
            },
        }, {owner: scenario});
        scenario.gameZone.addToGameZone(encounterCard);
        await encounterCard.initTriggers();

        await encounterCard.discard();

        assert.ok(
            scenario.additionalZones.collection.cards.includes(encounterCard)
        );
        assert.ok(!scenario.deck.discardPile.includes(encounterCard));

        const playerCard = scenario.additionalZones.collection.cards.find(card =>
            card.owner === player);
        await new DiscardFromGameEffect({
            match,
            selectedTarget: playerCard,
            target: TARGET_SOURCE,
            source: 'match.scenario.additionalZones.collection.cards',
        }).runEffect({player});

        assert.ok(
            !scenario.additionalZones.collection.cards.includes(playerCard)
        );
        assert.ok(player.deck.discardPile.includes(playerCard));

        await new DiscardFromGameEffect({
            match,
            selectedTarget: encounterCard,
            target: TARGET_SOURCE,
            source: 'match.scenario.additionalZones.collection.cards',
        }).runEffect({player});

        assert.ok(
            !scenario.additionalZones.collection.cards.includes(encounterCard)
        );
        assert.ok(scenario.deck.discardPile.includes(encounterCard));

        const victoryCard = factory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_UPGRADE,
            params: {
                name: 'Carta con Victoria en la Colección',
                set: SET,
                keywords: {victory: 1},
            },
        }, {owner: player});
        await scenario.addToAdditionalZone('collection', victoryCard, {player});
        await new DiscardFromGameEffect({
            match,
            selectedTarget: victoryCard,
            target: TARGET_SOURCE,
            source: 'match.scenario.additionalZones.collection.cards',
        }).runEffect({player});

        assert.ok(!scenario.additionalZones.collection.cards.includes(victoryCard));
        assert.ok(player.deck.discardPile.includes(victoryCard));
        assert.ok(!match.victoryDisplay.includes(victoryCard));
    });

    test('Victory X cards enter the shared Victory Display instead of the Collection or discard piles', async () => {
        const {factory, match, player, scenario} = await createScenario();

        await scenario.initScenario(match.createObligations(), false);

        const ally = factory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_ALLY,
            params: {
                name: 'Aliado con Victoria',
                set: SET,
                attack: 1,
                thwart: 1,
                hitPoints: 2,
                keywords: {victory: 2},
            },
        }, {owner: player});
        ally.controller = player;
        player.gameZone.addToGameZone(ally);
        await ally.initTriggers();
        let refreshCount = 0;
        match.refresh = async () => {
            refreshCount++;
        };

        const defeat = new DefeatEffect({
            match,
            selectedTarget: ally,
            target: TARGET_CARD,
        });
        await defeat.runEffect({match, player, card: ally});

        assert.equal(ally.victory, 2);
        assert.deepEqual(match.victoryDisplay, [ally]);
        assert.ok(!scenario.additionalZones.collection.cards.includes(ally));
        assert.ok(!player.deck.discardPile.includes(ally));
        assert.ok(!player.gameZone.cards.includes(ally));
        assert.equal(match.toObj().victoryDisplay[0].id, ally.id);
        assert.equal(refreshCount, 1);

        delete match.persist;
        delete match.refresh;
        delete match.openDialog;
        const restoredMatch = restoreMatch(serializeMatch(match), match.mc);
        assert.equal(restoredMatch.victoryDisplay[0].id, ally.id);
    });

    test('Victory X attachments enter the Victory Display when their host is defeated', async () => {
        const {factory, match, player, scenario} = await createScenario();

        await scenario.initScenario(match.createObligations(), false);

        const host = factory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_ALLY,
            params: {
                name: 'Aliado con accesorio',
                set: SET,
                attack: 1,
                thwart: 1,
                hitPoints: 2,
            },
        }, {owner: player});
        host.controller = player;
        player.gameZone.addToGameZone(host);
        await host.initTriggers();

        const attachment = factory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_UPGRADE,
            params: {
                name: 'Accesorio con Victoria',
                set: SET,
                keywords: {victory: 1},
            },
        }, {owner: player});
        attachment.controller = player;
        player.gameZone.addToGameZone(attachment);
        attachment.attachedTo = host;
        host.attached.push(attachment);

        const defeat = new DefeatEffect({
            match,
            selectedTarget: host,
            target: TARGET_CARD,
        });
        await defeat.runEffect({match, player, card: host});

        assert.ok(match.victoryDisplay.includes(attachment));
        assert.ok(!scenario.additionalZones.collection.cards.includes(attachment));
        assert.ok(!player.deck.discardPile.includes(attachment));
        assert.ok(!host.attached.includes(attachment));
        assert.ok(scenario.additionalZones.collection.cards.includes(host));
    });

    test('a defeated Villain with Victory X enters the Victory Display after the stage transition', async () => {
        const {match, player, scenario} = await createScenario();

        await scenario.initScenario(match.createObligations(), false);
        const villain = scenario.gameZone.currentVillain;
        villain.currentSide.card.keywords._victory = 1;

        await new DefeatEffect({
            match,
            selectedTarget: villain,
            target: TARGET_CARD,
        }).runEffect({match, player, card: villain});

        assert.ok(match.victoryDisplay.includes(villain));
        assert.notEqual(scenario.gameZone.currentVillain, villain);
        assert.equal(scenario.gameZone.currentVillain.stage, 2);
        assert.ok(!scenario.deck.discardPile.includes(villain));
    });

    test('a Victory X card with Uses enters the Victory Display when its last counter is removed', async () => {
        const {factory, match, player, scenario} = await createScenario();

        await scenario.initScenario(match.createObligations(), false);

        const card = factory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_UPGRADE,
            params: {
                name: 'Mejora con Victoria y Usos',
                set: SET,
                keywords: {
                    uses: 'carga',
                    victory: 3,
                },
            },
        }, {owner: player});
        card.controller = player;
        player.gameZone.addToGameZone(card);
        card.counters = 1;

        const removeCounters = new RemoveCountersEffect({
            selectedTarget: card,
            count: 1,
            match,
        });
        await removeCounters.execute({match, player});

        assert.equal(removeCounters.removedCounters, 1);
        assert.ok(match.victoryDisplay.includes(card));
        assert.ok(!player.deck.discardPile.includes(card));
        assert.ok(!scenario.additionalZones.collection.cards.includes(card));
    });

    test('a Victory X card with Uses enters the Victory Display when its last counter is moved', async () => {
        const {factory, match, player, scenario} = await createScenario();

        await scenario.initScenario(match.createObligations(), false);

        const card = factory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_UPGRADE,
            params: {
                name: 'Mejora con Victoria y Usos movida',
                set: SET,
                keywords: {
                    uses: 'carga',
                    victory: 1,
                },
            },
        }, {owner: player});
        card.controller = player;
        player.gameZone.addToGameZone(card);
        card.counters = 1;
        const destination = {
            counters: 0,
            placeCounters(count) {
                this.counters += count;
            },
            refresh: async () => {},
        };
        const moveCounters = new MoveCountersEffect({
            fromTarget: TARGET_SOURCE,
            target: TARGET_CARD,
            counters: 1,
            match,
            selectedTarget: card,
        });
        moveCounters.selectedDestination = destination;

        await moveCounters.execute({match, player});

        assert.equal(moveCounters.movedCounters, 1);
        assert.ok(match.victoryDisplay.includes(card));
        assert.ok(!player.deck.discardPile.includes(card));
        assert.ok(!scenario.additionalZones.collection.cards.includes(card));
    });

    test('the main scheme action discards a card from its configured zone', async () => {
        const {match, player, scenario} = await createScenario([
            'Carta de la Colección',
            'Carta restante',
        ]);
        await scenario.initScenario(match.createObligations(), false);
        const heroSide = player.superhero.sides.find(side => side.isHero);
        await player.superhero.flip({player, selectedFormTarget: heroSide});

        const collectedCard = scenario.additionalZones.collection.cards[0];
        const schemeSide = scenario.gameZone.currentScheme.currentSide;
        const action = schemeSide.abilities.find(ability =>
            ability.limit?.perPlayer);

        const scenarioView = await scenario.toObjWithAbilityAvailability(player);
        const serializedScheme = scenarioView.zones.find(zone =>
            zone.id === scenario.gameZone.id).mainScheme;
        const serializedAction = serializedScheme.abilities.find(ability =>
            ability.index === schemeSide.abilities.indexOf(action));

        assert.equal(serializedAction.name, 'Descarta 1 carta de La Colección');
        assert.equal(serializedAction.disable, false);
        assert.equal(serializedScheme.playable, true);
        assert.equal(action.arrow.cost.effectType, EFFECT_CHOOSE);
        assert.equal(action.effect.effectType, EFFECT_DISCARD_GAME);
        assert.equal(await action.canRun({match, player, card: schemeSide}), true);
        await player.resolveAbility(
            schemeSide.id,
            schemeSide.abilities.indexOf(action)
        );

        assert.ok(
            !scenario.additionalZones.collection.cards.includes(collectedCard)
        );
        assert.ok(player.deck.discardPile.includes(collectedCard));
        assert.equal(player.superhero.currentSide.exhausted, true);
    });

    test('the main scheme action can pay its resource arrow cost', async () => {
        const {match, player, scenario} = await createScenario([
            'Carta de la Colección',
            'Recurso uno',
            'Recurso dos',
            'Carta restante',
        ]);
        await scenario.initScenario(match.createObligations(), false);
        const heroSide = player.superhero.sides.find(side => side.isHero);
        await player.superhero.flip({player, selectedFormTarget: heroSide});
        const [resourceOne, resourceTwo] = await player.deck.draw(2);
        player.hand.addCards([resourceOne, resourceTwo]);
        assert.deepEqual(
            player.hand.cards.map(card => card.name).sort(),
            ['Recurso dos', 'Recurso uno']
        );

        const openDialog = match.openDialog;
        match.openDialog = async ({data, dialogType, ...params}) => {
            if (dialogType === DIALOG_LIST) {
                const resourceOption = data.options?.find(option =>
                    option.text === 'Gasta 2 recursos de cualquier tipo');
                if (resourceOption) {
                    return {selected: resourceOption};
                }
            }
            if (dialogType === DIALOG_PAY_COST) {
                assert.equal(data.cards.hand.length, 2);
                assert.deepEqual(
                    data.cards.hand.map(card => card.name).sort(),
                    ['Recurso dos', 'Recurso uno']
                );
                return {
                    fullyPaid: true,
                    paid: {
                        generators: [],
                        hand: data.cards.hand.map(({id}) => ({id})),
                    },
                    resources: [RESOURCE_MENTAL, RESOURCE_MENTAL],
                };
            }
            if (dialogType === DIALOG_DISCARD_ORDER) {
                assert.deepEqual(
                    data.cards.map(card => card.name).sort(),
                    ['Recurso dos', 'Recurso uno']
                );
                return {selected: data.cards};
            }

            return openDialog({data, dialogType, ...params});
        };

        const collectedCard = scenario.additionalZones.collection.cards[0];
        const schemeSide = scenario.gameZone.currentScheme.currentSide;
        const action = schemeSide.abilities.find(ability =>
            ability.limit?.perPlayer);

        await action.resolveAbility({
            card: schemeSide,
            match,
            player,
        });

        assert.ok(!scenario.additionalZones.collection.cards.includes(collectedCard));
        assert.ok(player.deck.discardPile.includes(collectedCard));
        assert.ok(player.deck.discardPile.includes(resourceOne));
        assert.ok(player.deck.discardPile.includes(resourceTwo));
        assert.equal(player.superhero.currentSide.exhausted, false);
    });

    test('five cards in the Collection end the game and action limits are per player', async () => {
        const {match, player, scenario} = await createScenario();

        await scenario.initScenario(match.createObligations(), false);
        for (let index = 0; index < 5; index++) {
            await scenario.addToAdditionalZone('collection', {
                id: `collection-${index}`,
                toObj() {
                    return {id: this.id};
                },
            }, {player});
        }

        assert.equal(
            match.gameOverReason,
            MATCH_END_REASON_SCENARIO_FAILED
        );

        const action = scenario.gameZone.currentScheme.currentSide.abilities
            .find(ability => ability.limit?.perPlayer);
        assert.equal(action.limit.perPlayer, true);
        assert.equal(action.limit.canUse({player}), true);
        action.useLimit({player});
        assert.equal(action.limit.canUse({player}), false);
        assert.equal(action.limit.canUse({player: {id: 'other-player'}}), true);
        action.limit.clean();
        assert.equal(action.limit.canUse({player}), true);
    });
});
