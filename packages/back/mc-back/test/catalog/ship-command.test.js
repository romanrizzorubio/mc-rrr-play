import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    ABILITY_FIRST_PLAYER_ACTION,
    CARD_TYPE_ENVIRONMENT,
    DIALOG_LIST,
    EFFECT_CHOOSE,
    EFFECT_DEAL_DAMAGE,
    EFFECT_DISCARD_RANDOM,
    EFFECT_ENEMY_ATTACK,
    EFFECT_ENEMY_SCHEME,
    EFFECT_EXHAUST,
    EFFECT_FOR_EACH,
    EFFECT_STUN,
    TARGET_ALL_SUPERHEROES,
    TARGET_CONDITION_CARD,
    TARGET_INITIAL_PLAYER,
    TARGET_INITIAL_PLAYER_SUPERHERO,
} from 'mc-shared';
import shipCommand from '../../../mc-data/seed/catalog/sets/ship-command.js';
import {MayEffect} from '../../src/effects/may-effect.js';
import {PlayVillainPhaseEffect} from '../../src/effects/play-villain-phase-effect.js';
import {RevealEncounterEffect} from '../../src/effects/reveal-encounter-effect.js';
import {EffectsFactory} from '../../src/factory/effects/effects-factory.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';
import {Player} from '../../src/model/match/player.js';
import {Scenario} from '../../src/model/match/scenario.js';
import {basicTargets} from '../../src/targets/basic.js';
import {groupTargets} from '../../src/targets/groups.js';
import {ValidTarget} from '../../src/targets/valid-target.js';
import blackPanther from '../../../mc-data/seed/catalog/heroes/blackpanther.js';

describe('Ship Command modular encounter set', () => {
    test('uses the first-player action type and the printed amplification icon', () => {
        const hostileShip = shipCommand.config.cards.find(({card}) =>
            card.type === CARD_TYPE_ENVIRONMENT &&
            card.params.name === 'Nave hostil').card;
        const underFire = shipCommand.config.cards.find(({card}) =>
            card.params.name === 'A cañonazos').card;

        assert.ok(hostileShip.params.abilities.some(ability =>
            ability.type === ABILITY_FIRST_PLAYER_ACTION));
        assert.ok(underFire.params.abilities.some(ability =>
            ability.type === ABILITY_FIRST_PLAYER_ACTION));
        assert.equal(
            underFire.params.abilities[0].params.name,
            'Agota la Milano para quitar 3 de amenaza de este plan'
        );
        assert.deepEqual(underFire.params.icons, {amplification: 1});
    });

    test('targets every player superhero regardless of identity', () => {
        const match = new Match({
            mc: {mcSocket: {send() {}}},
            name: 'ship-command-superhero-damage',
        });
        const matchFactory = new MatchFactory(match);
        const createPlayer = (id, selectedSide) => {
            const superhero = matchFactory.createSuperhero({
                ...blackPanther.config,
                cards: [],
                nemesis: [],
                precon: [],
            });
            superhero.selectedSide = selectedSide;
            const player = new Player({
                id,
                initial: false,
                name: id,
                superhero,
                userId: id,
            });
            player.initPlayer();

            return player;
        };
        const heroPlayer = createPlayer('hero', 1);
        const alterEgoPlayer = createPlayer('alter-ego', 0);
        const ally = {id: 'ally', isAlly: true, isSuperhero: false};
        heroPlayer.gameZone.cards.push(ally);
        match.players = [heroPlayer, alterEgoPlayer];
        const hostileShip = shipCommand.config.cards.find(({card}) =>
            card.params.name === 'Nave hostil').card;
        const damage = hostileShip.params.abilities[0].params.effect;

        assert.equal(damage.type, EFFECT_DEAL_DAMAGE);
        assert.equal(damage.params.target, TARGET_ALL_SUPERHEROES);
        assert.deepEqual(groupTargets[TARGET_ALL_SUPERHEROES]({
            match,
            player: heroPlayer,
        }), [heroPlayer.superhero, alterEgoPlayer.superhero]);
        assert.equal(new ValidTarget({match}).isMultipleTarget({
            target: TARGET_ALL_SUPERHEROES,
        }), true);
    });

    test('keeps Nave hostil triggers through Surge and resolves its interrupt at villain phase end', async () => {
        const match = new Match({
            mc: {mcSocket: {send() {}}},
            name: 'ship-command-hostile-ship-surge',
        });
        const matchFactory = new MatchFactory(match);
        const scenario = new Scenario({
            mainSchemes: [],
            match,
            name: 'Ship Command',
            scenarioCards: [],
            sets: [],
            villains: [],
        });
        scenario.createZone();
        scenario.deck = {cards: [], discardPile: []};
        match.scenario = scenario;
        match.phase = 'villain';
        match.playing = true;
        match.skipSurgeNotification = true;
        match.openDialog = async dialog => ({
            selected: dialog.data.cards[0],
        });

        const players = ['first', 'second'].map((id, index) => {
            const superhero = matchFactory.createSuperhero({
                ...blackPanther.config,
                cards: [],
                nemesis: [],
                precon: [],
            });
            superhero.selectedSide = 1;
            const player = new Player({
                id,
                initial: index === 0,
                name: id,
                superhero,
                userId: id,
            });
            player.initPlayer();

            return player;
        });
        match.players = players;

        const hostileShipConfig = shipCommand.config.cards.find(({card}) =>
            card.params.name === 'Nave hostil').card;
        const hostileShip = matchFactory.cardsFactory.createGameCardFromConfig(
            hostileShipConfig,
            {owner: scenario}
        );
        hostileShip.controller = scenario;
        hostileShip.scenarioZone = scenario.gameZone;
        scenario.gameZone.addToGameZone(hostileShip);
        await hostileShip.initTriggers();

        const lifeBeforeSurge = await Promise.all(players.map(({superhero}) =>
            superhero.getLife()
        ));
        await new RevealEncounterEffect({
            match,
            selectedTarget: hostileShip,
        }).applySurge({
            match,
            player: players[0],
        });

        assert.strictEqual(match.triggerCards[hostileShip.id], hostileShip);

        const phase = new PlayVillainPhaseEffect({match});
        await phase.triggerEnds({
            effect: phase,
            player: players[0],
        });

        assert.deepEqual(
            await Promise.all(players.map(({superhero}) => superhero.getLife())),
            lifeBeforeSurge.map(life => life - 1)
        );
    });

    test('scales A cañonazos complication by player count', () => {
        const match = new Match({
            mc: {mcSocket: {send() {}}},
            name: 'ship-command-hinder',
        });
        const matchFactory = new MatchFactory(match);
        const underFire = shipCommand.config.cards.find(({card}) =>
            card.params.name === 'A cañonazos').card;
        match.players = [{}, {}, {}];
        const gameCard = matchFactory.cardsFactory.createGameCardFromConfig(
            underFire,
            {owner: {}}
        );

        assert.deepEqual(underFire.params.keywords.hinder, [3, true]);
        assert.equal(gameCard.hinder, 9);
    });

    test('targets the initial player without a one-target for-each', () => {
        const blindSpot = shipCommand.config.cards.find(({card}) =>
            card.params.name === 'Punto ciego').card;
        const hullBreach = shipCommand.config.cards.find(({card}) =>
            card.params.name === 'Brecha en el casco').card;
        const powerLoss = shipCommand.config.cards.find(({card}) =>
            card.params.name === 'Pérdida de energía').card;
        const blindSpotChoice = blindSpot.params.abilities[0].params.effect;
        const hullBreachChoice = hullBreach.params.abilities[0].params.effect;
        const stun = blindSpotChoice.params.options[2];
        const damage = hullBreachChoice.params.options[2];
        const discard = powerLoss.params.abilities[0].params.effect.params.options[2];

        assert.equal(stun.type, EFFECT_STUN);
        assert.equal(stun.params.target, TARGET_INITIAL_PLAYER);
        assert.notEqual(stun.type, EFFECT_FOR_EACH);
        assert.equal(damage.type, EFFECT_DEAL_DAMAGE);
        assert.equal(damage.params.target, TARGET_INITIAL_PLAYER_SUPERHERO);
        assert.equal(discard.type, EFFECT_DISCARD_RANDOM);
        assert.equal(discard.params.target, TARGET_INITIAL_PLAYER);
        assert.notEqual(discard.type, EFFECT_FOR_EACH);
    });

    test('resolves the initial player superhero in the acting player zone', () => {
        const superhero = {id: 'initial-superhero'};
        const initialPlayer = {superhero};
        const otherPlayer = {};
        const match = {
            initialPlayer,
            players: [initialPlayer, otherPlayer],
        };

        assert.deepEqual(basicTargets[TARGET_INITIAL_PLAYER_SUPERHERO]({
            match,
            player: otherPlayer,
        }), [superhero]);
    });

    test('sets up Milano from the permanent set-aside zone and follows the initial player', async () => {
        const match = new Match({
            mc: {mcSocket: {send() {}}},
            name: 'ship-command-setup',
        });
        const matchFactory = new MatchFactory(match);
        const createPlayer = (id, initial) => {
            const superhero = matchFactory.createSuperhero({
                ...blackPanther.config,
                cards: [],
                nemesis: [],
                precon: [],
            });
            const player = new Player({
                id,
                initial,
                name: id,
                superhero,
                userId: id,
            });
            player.initPlayer();
            player.gameZone.refresh = async () => {};

            return player;
        };
        const firstPlayer = createPlayer('first', true);
        const secondPlayer = createPlayer('second', false);
        const scenario = {
            apart: [],
            deck: {cards: []},
        };
        const milanoConfig = shipCommand.config.cards.find(({card}) =>
            card.params.name === 'Milano').card;
        const milano = matchFactory.cardsFactory.createGameCardFromConfig(
            milanoConfig,
            {owner: scenario}
        );
        scenario.apart.push(milano);
        match.players = [firstPlayer, secondPlayer];
        match.scenario = scenario;

        await match.resolveSetupDecks();

        assert.equal(milano.setupKeyword, true);
        assert.equal(scenario.apart.includes(milano), false);
        assert.ok(firstPlayer.gameZone.cards.includes(milano));
        assert.equal(milano.controller, firstPlayer);

        await match.setInitialPlayer(secondPlayer);

        assert.equal(firstPlayer.gameZone.cards.includes(milano), false);
        assert.ok(secondPlayer.gameZone.cards.includes(milano));
        assert.equal(milano.controller, secondPlayer);
    });

    test('shows Entrega especial with its identity-specific activation choice', async () => {
        const match = new Match({
            mc: {mcSocket: {send() {}}},
            name: 'ship-command-may',
        });
        const matchFactory = new MatchFactory(match);
        const scenario = {
            apart: [],
            deck: {cards: []},
            gameZone: {
                players: [],
                searchCards() {
                    return [];
                },
            },
        };
        match.scenario = scenario;
        const createPlayer = (id, initial, isHero) => {
            const superhero = matchFactory.createSuperhero({
                ...blackPanther.config,
                cards: [],
                nemesis: [],
                precon: [],
            });
            superhero.selectedSide = isHero ? 1 : 0;
            const player = new Player({
                id,
                initial,
                name: id,
                superhero,
                userId: id,
            });
            player.initPlayer();
            player.scenarioZone = scenario.gameZone;
            player.gameZone.refresh = async () => {};

            return player;
        };
        const controller = createPlayer('controller', true, false);
        const resolver = createPlayer('resolver', false, false);
        match.players = [controller, resolver];
        scenario.gameZone.players = match.players;
        const milanoConfig = shipCommand.config.cards.find(({card}) =>
            card.params.name === 'Milano').card;
        const deliveryConfig = shipCommand.config.cards.find(({card}) =>
            card.params.name === 'Entrega especial').card;
        const milano = matchFactory.cardsFactory.createGameCardFromConfig(
            milanoConfig,
            {owner: scenario}
        );
        milano.controller = controller;
        milano.refresh = async () => {};
        controller.gameZone.addToGameZone(milano);
        const delivery = matchFactory.cardsFactory.createGameCardFromConfig(
            deliveryConfig,
            {owner: scenario}
        );
        let dialog;
        match.openDialog = async params => {
            dialog = params;

            return {selected: {id: 0}};
        };

        const alterEgoAbility = delivery.abilities.find(ability =>
            ability.isValidIdentity({player: resolver}) &&
            ability.effect.effectType === EFFECT_CHOOSE);
        const alterEgoEffect = alterEgoAbility.effect.createInstance({
            ability: alterEgoAbility,
        });
        const [milanoChoice, fallbackEffect] = alterEgoEffect.options;
        let fallbackResolved = false;
        fallbackEffect.canRun = async () => true;
        fallbackEffect.prepare = async () => {};
        fallbackEffect.runEffect = async () => {
            fallbackResolved = true;
        };

        assert.ok(alterEgoAbility);
        assert.equal(alterEgoEffect.effectType, EFFECT_CHOOSE);
        assert.equal(milanoChoice.effectType, EFFECT_EXHAUST);
        assert.equal(fallbackEffect.effectType, EFFECT_ENEMY_SCHEME);
        assert.deepEqual(match.searchCards({'card.name': 'Milano'}, resolver), [milano]);
        assert.equal(milanoChoice.target, TARGET_CONDITION_CARD);
        assert.deepEqual(milanoChoice.condition, {'card.name': 'Milano'});
        assert.equal(milanoChoice.getValidTarget({
            ability: alterEgoAbility,
            card: delivery,
            match,
            player: resolver,
        }).length, 1);
        assert.equal(await alterEgoEffect.canRun({
            card: delivery,
            match,
            player: resolver,
        }), true);
        await alterEgoEffect.runEffect({
            card: delivery,
            match,
            player: resolver,
        });

        assert.equal(dialog.targetPlayer, resolver.userId);
        assert.equal(dialog.dialogType, DIALOG_LIST);
        assert.equal(dialog.data.card.name, 'Entrega especial');
        assert.equal(dialog.data.card.image, 'sets/ship-command/16148.png');
        assert.deepEqual(dialog.data.options, [
            {id: 0, text: 'Agotar la Milano'},
            {id: 1, text: 'El Villano ejecuta el Plan con +1 PLA'},
        ]);
        assert.equal(milano.exhausted, true);
        assert.equal(fallbackResolved, false);

        resolver.superhero.selectedSide = 1;
        milano.ready();
        dialog = undefined;
        const heroAbility = delivery.abilities.find(ability =>
            ability.isValidIdentity({player: resolver}) &&
            ability.effect.effectType === EFFECT_CHOOSE);
        const heroEffect = heroAbility.effect.createInstance({
            ability: heroAbility,
        });
        const heroFallback = heroEffect.options[1];
        let heroFallbackResolved = false;
        heroFallback.canRun = async () => true;
        heroFallback.prepare = async () => {};
        heroFallback.runEffect = async () => {
            heroFallbackResolved = true;
        };
        match.openDialog = async params => {
            dialog = params;

            return {selected: {id: 1}};
        };

        assert.equal(heroFallback.effectType, EFFECT_ENEMY_ATTACK);
        await heroEffect.runEffect({
            card: delivery,
            match,
            player: resolver,
        });

        assert.equal(dialog.targetPlayer, resolver.userId);
        assert.equal(dialog.data.card.name, 'Entrega especial');
        assert.equal(dialog.data.card.image, 'sets/ship-command/16148.png');
        assert.deepEqual(dialog.data.options, [
            {id: 0, text: 'Agotar la Milano'},
            {id: 1, text: 'El Villano te ataca con +1 ATQ'},
        ]);
        assert.equal(milano.exhausted, false);
        assert.equal(heroFallbackResolved, true);

        milano.exhaust();
        dialog = undefined;
        const exhaustedEffect = heroAbility.effect.createInstance({
            ability: heroAbility,
        });
        let exhaustedFallbackResolved = false;
        exhaustedEffect.options[1].canRun = async () => true;
        exhaustedEffect.options[1].prepare = async () => {};
        exhaustedEffect.options[1].runEffect = async () => {
            exhaustedFallbackResolved = true;
        };
        await exhaustedEffect.runEffect({
            card: delivery,
            match,
            player: resolver,
        });

        assert.equal(dialog, undefined);
        assert.equal(exhaustedFallbackResolved, true);
    });

    test('offers the Milano and activation choices for Entrega especial', () => {
        const specialDelivery = shipCommand.config.cards.find(({card}) =>
            card.params.name === 'Entrega especial').card;
        const effectsFactory = new EffectsFactory({match: {}});
        const expectedActivationChoices = [
            'El Villano ejecuta el Plan con +1 PLA',
            'El Villano te ataca con +1 ATQ',
        ];

        specialDelivery.params.abilities.forEach((ability, index) => {
            const choose = ability.params.effect;

            assert.equal(choose.type, EFFECT_CHOOSE);
            assert.deepEqual(choose.params.options.map(({params}) =>
                params.title
            ), [
                'Agotar la Milano',
                expectedActivationChoices[index],
            ]);

            const parsedChoose = effectsFactory.parseEffect(choose);
            assert.equal(parsedChoose.effectType, EFFECT_CHOOSE);
            assert.deepEqual(parsedChoose.options.map(option =>
                option.getTitle()
            ), [
                'Agotar la Milano',
                expectedActivationChoices[index],
            ]);
        });
    });

    test('resolves the fallback when the optional effect is declined', async () => {
        let exhausted = false;
        let fallbackResolved = false;
        const may = new MayEffect({
            match: {},
            title: 'Exhaust Milano?',
            effect: {
                canRun: async () => true,
                runEffect: async () => {
                    exhausted = true;
                },
            },
            effectNot: {
                canRun: async () => true,
                runEffect: async () => {
                    fallbackResolved = true;
                },
            },
        });
        may.confirm = async () => false;

        assert.ok(may instanceof MayEffect);
        await may.execute({player: {}});

        assert.equal(exhausted, false);
        assert.equal(fallbackResolved, true);
    });

    test('resolves the fallback without prompting when the May effect is unavailable', async () => {
        let fallbackResolved = false;
        const may = new MayEffect({
            match: {},
            title: 'Exhaust Milano?',
            effect: {
                canRun: async () => false,
                runEffect: async () => assert.fail('Unavailable effect resolved'),
            },
            effectNot: {
                canRun: async () => true,
                runEffect: async () => {
                    fallbackResolved = true;
                },
            },
        });
        may.confirm = async () => assert.fail('Unavailable May effect prompted');

        assert.equal(await may.canRun({player: {}}), true);
        await may.execute({player: {}});

        assert.equal(fallbackResolved, true);
    });
});
