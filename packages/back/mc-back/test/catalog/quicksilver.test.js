import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    ABILITY_INTERRUPT,
    ABILITY_HERO_RESPONSE,
    ABILITY_RESOURCE,
    ABILITY_BOOST,
    CALC_ALL,
    CALC_COUNT,
    CARD_TYPE_ALLY,
    CARD_TYPE_ATTACHMENT,
    CARD_TYPE_EVENT,
    CARD_TYPE_HERO,
    CARD_TYPE_MINION,
    CARD_TYPE_OBLIGATION,
    CARD_TYPE_SIDE_SCHEME_SCENARIO,
    CARD_TYPE_TREACHERY,
    CARD_TYPE_UPGRADE,
    CLASSIFICATION_BASIC,
    CLASSIFICATION_PROTECTION,
    DECK_POSITION_SHUFFLE,
    EFFECT_CANNOT,
    EFFECT_CANCEL_ENCOUNTER,
    EFFECT_CHAINED,
    EFFECT_CHOOSE_ABILITY,
    EFFECT_COUNT_BOOST_ICONS,
    EFFECT_DEAL_DAMAGE,
    EFFECT_DISCARD_GAME,
    EFFECT_EXHAUST,
    EFFECT_MODIFY_ATTACK_VALUE,
    EFFECT_MAY,
    EFFECT_REPEAT,
    EFFECT_REMOVE_THREAT,
    EFFECT_SPEND,
    DIALOG_LIST,
    DIALOG_PAY_COST,
    DIALOG_USE_CARD,
    PRIORITY_INTERRUPT,
    PRIORITY_CONSTANT,
    PLACE_DISCARD_PILE,
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    RESOURCES_X,
    TARGET_DECK,
    TARGET_ENEMY,
    TARGET_PHASE,
    TARGET_ROUND,
    TARGET_VILLAIN,
    TRAIT_BROTHERHOOD_OF_MUTANTS,
    TRAIT_X_FACTOR,
    TRIGGER_CARD_ENTER_PLAY,
    TRIGGER_CHARACTER_READIED,
    TRIGGER_PLAYER_CAN_READY,
    TRIGGER_PLAYER_TURN_END,
    TRIGGER_THIS_ATTACK,
    TRIGGER_THIS_THWARTS,
    TRIGGER_TREACHERY_REVEAL,
    TRIGGER_YOU_BASIC_ATTACK,
    TRIGGER_YOU_BASIC_DEFENSE,
    TRIGGER_YOU_BASIC_THWART,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {checkCondition} from '../../src/engine/utils.js';
import {GetCostEffect} from '../../src/effects/get-cost-effect.js';
import {DealDamageEffect} from '../../src/effects/deal-damage-effect.js';
import {EnemyAttackEffect} from '../../src/effects/enemy-attack-effect.js';
import {PlayCardEffect} from '../../src/effects/play-card-effect.js';
import {RemoveThreatEffect} from '../../src/effects/remove-threat-effect.js';
import {ReadyEffect} from '../../src/effects/ready-effect.js';
import {StunEffect} from '../../src/effects/stun-effect.js';
import {PlayTurnEffect} from '../../src/effects/play-turn-effect.js';
import {CostPaymentSession} from '../../src/utils/cost-payment-session.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';

const getCardEntry = (hero, name) =>
    hero.config.cards.find(({card}) => card.params.name === name);

const getAspectEntry = (catalog, id) =>
    catalog.aspects.find(entry => entry._id === id);

const createGameCard = (cardsFactory, card) => cardsFactory.createGameCard({
    card: cardsFactory.createCard(card),
    owner: {},
});

describe('Mercurio hero cards', () => {
    test('catalog data and precon match the supplied cards', async () => {
        const catalog = await loadCatalog();
        const {heroes} = catalog;
        const quicksilver = heroes.find(({_id}) => _id === 'quicksilver');

        assert.ok(quicksilver);
        assert.equal(quicksilver.config.cards.reduce(
            (total, {count}) => total + count,
            0
        ), 15);
        assert.deepEqual(
            quicksilver.config.cards.map(({count}) => count),
            [1, 4, 2, 2, 1, 1, 1, 1, 1, 1]
        );

        const [pietro, mercurio] = quicksilver.config.sides;
        assert.equal(pietro.type, 'alter-ego');
        assert.equal(pietro.params.name, 'Pietro Maximoff');
        assert.equal(pietro.params.recovery, 3);
        assert.equal(pietro.params.hitPoints, 9);
        assert.equal(pietro.params.handSize, 6);
        assert.equal(mercurio.type, CARD_TYPE_HERO);
        assert.equal(mercurio.params.name, 'Mercurio');
        assert.equal(mercurio.params.hitPoints, 9);
        assert.equal(mercurio.params.handSize, 5);
        assert.deepEqual([
            mercurio.params.thwart,
            mercurio.params.attack,
            mercurio.params.defense,
        ], [1, 1, 1]);

        const wanda = getCardEntry(quicksilver, 'Bruja Escarlata').card;
        assert.equal(wanda.type, CARD_TYPE_ALLY);
        assert.equal(wanda.params.attackConsequential, 1);
        assert.equal(wanda.params.thwartConsequential, 1);
        assert.equal(getCardEntry(quicksilver, 'Siempre corriendo').count, 4);
        assert.equal(getCardEntry(quicksilver, 'Por partida doble').count, 2);
        assert.equal(getCardEntry(quicksilver, 'Máxima velocidad').count, 2);
        assert.equal(getCardEntry(quicksilver, 'Velocidad de huracán').count, 1);
        assert.deepEqual(
            getCardEntry(quicksilver, 'Industrias Serval').card.params.traits,
            ['location', TRAIT_X_FACTOR]
        );
        assert.deepEqual(
            getCardEntry(quicksilver, 'Industrias Serval')
                .card.params.abilities[0].params.effect.params.effects[0]
                .params.locations,
            [PLACE_DISCARD_PILE]
        );
        assert.equal(
            getCardEntry(quicksilver, 'Resistencia a la fricción')
                .card.params.abilities[1].type,
            ABILITY_RESOURCE
        );

        const cardRefs = quicksilver.config.precon.flatMap(({cardRefs: refs}) =>
            refs.map(({id, count}) => [id, count]));
        assert.deepEqual(cardRefs.sort(([left], [right]) =>
            left.localeCompare(right)), [
            ['basic-deber-civico', 3],
            ['basic-descarga-adrenalina', 3],
            ['basic-energy', 1],
            ['basic-genius', 1],
            ['basic-orden-y-caos', 1],
            ['basic-strength', 1],
            ['protection-chaleco-blindado', 2],
            ['protection-esquiva-lateral', 3],
            ['protection-hombre-multiple', 3],
            ['protection-nervios-de-acero', 3],
            ['protection-ni-un-paso-atras', 3],
            ['protection-warlock', 1],
        ]);
        assert.equal(cardRefs.reduce((total, [, count]) => total + count, 0), 25);
        assert.ok(quicksilver.config.precon.some(({classification}) =>
            classification === CLASSIFICATION_BASIC));
        assert.ok(quicksilver.config.precon.some(({aspect}) =>
            aspect === CLASSIFICATION_PROTECTION));
        assert.equal(quicksilver.config.precon.length, 2);

        const expectedAspectCards = [
            ['basic-orden-y-caos', 'Orden y caos', CARD_TYPE_EVENT],
            ['basic-descarga-adrenalina', 'Descarga de adrenalina', CARD_TYPE_UPGRADE],
            ['basic-deber-civico', 'Deber cívico', CARD_TYPE_UPGRADE],
            ['protection-hombre-multiple', 'Hombre Múltiple', CARD_TYPE_ALLY],
            ['protection-warlock', 'Warlock', CARD_TYPE_ALLY],
            ['protection-ni-un-paso-atras', 'Ni un paso atrás', CARD_TYPE_EVENT],
            ['protection-esquiva-lateral', 'Esquiva lateral', CARD_TYPE_EVENT],
            ['protection-nervios-de-acero', 'Nervios de acero', CARD_TYPE_UPGRADE],
        ];
        for (const [id, name, type] of expectedAspectCards) {
            const entry = getAspectEntry(catalog, id);
            assert.ok(entry, `Missing catalog card ${id}`);
            assert.equal(entry.card.params.name, name);
            assert.equal(entry.card.type, type);
        }

        const warlock = getAspectEntry(catalog, 'protection-warlock').card;
        assert.equal(
            warlock.params.abilities[0].params.name,
            'Gasta un recurso [m]: cura hasta 2 de Daño a Warlock'
        );
        assert.deepEqual(
            warlock.params.abilities[0].params.arrow.params.resources,
            [RESOURCE_MENTAL]
        );
        const sideStep = getAspectEntry(
            catalog,
            'protection-esquiva-lateral'
        ).card;
        assert.deepEqual(sideStep.params.resources, [RESOURCE_MENTAL]);
        assert.deepEqual(
            sideStep.params.abilities[0].params.effect.params.effects[1]
                .params.resources,
            [RESOURCE_ENERGY]
        );

        const teamUp = getAspectEntry(catalog, 'basic-orden-y-caos').card;
        assert.deepEqual(teamUp.params.keywords.teamUp, [
            'Mercurio',
            'Bruja Escarlata',
        ]);
        assert.deepEqual(teamUp.params.maximum, {
            count: 1,
            target: TARGET_DECK,
        });
        const teamUpAbility = teamUp.params.abilities[0];
        assert.equal(
            teamUpAbility.params.trigger,
            TRIGGER_TREACHERY_REVEAL
        );
        assert.equal(
            teamUpAbility.params.effect.type,
            EFFECT_CANCEL_ENCOUNTER
        );
        assert.equal(
            teamUpAbility.params.effect.params.type,
            CARD_TYPE_TREACHERY
        );
        assert.equal(teamUpAbility.params.effect.params.full, false);
        assert.equal(
            teamUpAbility.params.effect.params.thenEffect.type,
            EFFECT_DEAL_DAMAGE
        );
        assert.equal(
            teamUpAbility.params.effect.params.thenEffect.params.target,
            TARGET_VILLAIN
        );
        assert.equal(
            teamUpAbility.params.effect.params.thenEffect.params.damage,
            2
        );
        const multipleMan = getAspectEntry(
            catalog,
            'protection-hombre-multiple'
        ).card;
        assert.equal(multipleMan.params.unique ?? false, false);
        assert.equal(
            multipleMan.params.abilities[0].params.trigger,
            TRIGGER_CARD_ENTER_PLAY
        );
        const doubleTimeEffect = getCardEntry(quicksilver, 'Por partida doble')
            .card.params.abilities[0].params.effect;
        assert.equal(doubleTimeEffect.type, EFFECT_REPEAT);
        assert.equal(doubleTimeEffect.params.count, 2);
        assert.equal(
            doubleTimeEffect.params.effect.type,
            EFFECT_CHOOSE_ABILITY
        );
        assert.deepEqual(
            doubleTimeEffect.params.effect.params.options.map(({params}) =>
                params.effect.type),
            [EFFECT_DEAL_DAMAGE, EFFECT_REMOVE_THREAT]
        );

        assert.deepEqual(quicksilver.config.nemesis.map(({count, card}) =>
            [card.params.name, count]), [
            ['Extorsión de proporciones sísmicas', 1],
            ['Avalancha', 1],
            ['Resistencia a las vibraciones', 1],
            ['Terremoto', 2],
        ]);
        const [nemesisScheme, avalanche, vibrations, earthquake] =
            quicksilver.config.nemesis.map(({card}) => card);
        assert.equal(nemesisScheme.type, CARD_TYPE_SIDE_SCHEME_SCENARIO);
        assert.deepEqual(nemesisScheme.params.startingThreat, [2, true]);
        assert.equal(nemesisScheme.params.icons.crisis, true);
        assert.equal(avalanche.type, CARD_TYPE_MINION);
        assert.equal(avalanche.params.nemesis, true);
        assert.deepEqual(avalanche.params.traits, [
            TRAIT_BROTHERHOOD_OF_MUTANTS,
        ]);
        assert.equal(vibrations.type, CARD_TYPE_ATTACHMENT);
        assert.deepEqual(vibrations.params.attach, {
            target: TARGET_ENEMY,
            condition: {name: 'Avalancha'},
            fallbackTarget: TARGET_VILLAIN,
        });
        assert.equal(earthquake.type, CARD_TYPE_TREACHERY);
        assert.equal(earthquake.params.boostAbility.type, ABILITY_BOOST);

        const obligation = quicksilver.config.obligation;
        assert.equal(obligation.count, 1);
        assert.equal(obligation.card.type, CARD_TYPE_OBLIGATION);
        assert.equal(obligation.card.params.name, 'Vivir con prisa');
    });

    test('Warlock exposes the text of his healing action', async () => {
        const catalog = await loadCatalog();
        const warlockConfig = getAspectEntry(catalog, 'protection-warlock').card;
        const cardsFactory = new MatchFactory({triggerCards: {}}).cardsFactory;
        const warlock = createGameCard(cardsFactory, warlockConfig);
        const healingAction = warlock.abilities.find(({isAction}) => isAction);

        assert.ok(healingAction);
        assert.equal(
            healingAction.name,
            'Gasta un recurso [m]: cura hasta 2 de Daño a Warlock'
        );
    });

    test('Siempre corriendo prepares Mercurio by name', async () => {
        const {heroes} = await loadCatalog();
        const quicksilver = heroes.find(({_id}) => _id === 'quicksilver');
        const match = new Match({
            mc: {mcSocket: {send() {}}},
            name: 'quicksilver-always-running-test',
        });
        match.isUniqueCard = () => false;
        const matchFactory = new MatchFactory(match);
        const superhero = matchFactory.createSuperhero({
            ...quicksilver.config,
            precon: [],
        });
        const player = match.createPlayer({
            name: 'Pietro Maximoff',
            superhero,
        });
        player.initPlayer();
        superhero.selectedSide = 1;
        superhero.sides[0].exhausted = true;
        superhero.sides[1].exhausted = true;
        player.canReady = async () => true;
        superhero.sides[1].ready = async () => {
            superhero.sides[1].exhausted = false;
        };
        superhero.sides[1].refresh = async () => {};

        const event = createGameCard(
            matchFactory.cardsFactory,
            getCardEntry(quicksilver, 'Siempre corriendo').card
        );
        const readyEffect = event.abilities[0].effect;
        const params = {match, player, card: event};
        await readyEffect.prepare(params);
        assert.deepEqual(
            Array.isArray(readyEffect.selectedTarget) ?
                readyEffect.selectedTarget :
                [readyEffect.selectedTarget],
            [superhero.sides[1]]
        );
        await readyEffect.execute(params);

        assert.equal(superhero.sides[1].exhausted, false);
        assert.equal(superhero.sides[0].exhausted, true);
    });

    test('Pietro draws three cards only when Wanda Maximoff is in play', async () => {
        const {heroes} = await loadCatalog();
        const quicksilver = heroes.find(({_id}) => _id === 'quicksilver');
        const match = new Match({
            mc: {mcSocket: {send() {}}},
            name: 'quicksilver-brothers-test',
        });
        match.isUniqueCard = () => false;
        const matchFactory = new MatchFactory(match);
        const superhero = matchFactory.createSuperhero({
            ...quicksilver.config,
            precon: [],
        });
        const player = match.createPlayer({
            name: 'Pietro Maximoff',
            superhero,
        });
        player.initPlayer();
        const drawCounts = [];
        player.deck.draw = async count => {
            drawCounts.push(count);
            return [];
        };
        const ability = superhero.sides[0].abilities.find(({name}) =>
            name === 'Hermanos con superpoderes');

        await ability.effect.runEffect({player});
        assert.deepEqual(drawCounts, [2]);

        const wanda = createGameCard(
            matchFactory.cardsFactory,
            getCardEntry(quicksilver, 'Bruja Escarlata').card
        );
        player.addToGameZone(wanda);
        assert.ok(match.inPlayCards.some(card =>
            card.name === 'Bruja Escarlata' &&
            card.card.subtitle === 'Wanda Maximoff'));

        await ability.effect.runEffect({player});
        assert.deepEqual(drawCounts, [2, 3]);
    });

    test('Pietro recognizes Wanda Maximoff in alter-ego form', async () => {
        const {heroes} = await loadCatalog();
        const quicksilver = heroes.find(({_id}) => _id === 'quicksilver');
        const match = new Match({
            mc: {mcSocket: {send() {}}},
            name: 'quicksilver-wanda-alter-ego-test',
        });
        match.isUniqueCard = () => false;
        const matchFactory = new MatchFactory(match);
        const quicksilverIdentity = matchFactory.createSuperhero({
            ...quicksilver.config,
            precon: [],
        });
        const player = match.createPlayer({
            name: 'Pietro Maximoff',
            superhero: quicksilverIdentity,
        });
        player.initPlayer();
        const drawCounts = [];
        player.deck.draw = async count => {
            drawCounts.push(count);
            return [];
        };
        const wandaConfig = {
            ...quicksilver.config,
            precon: [],
            sides: quicksilver.config.sides.map((side, index) => index === 0 ? {
                ...side,
                params: {...side.params, name: 'Wanda Maximoff'},
            } : side),
        };
        const wanda = matchFactory.createSuperhero(wandaConfig);
        const wandaPlayer = match.createPlayer({
            name: 'Wanda Maximoff',
            superhero: wanda,
        });
        wandaPlayer.initPlayer();
        wanda.selectedSide = 0;
        const ability = quicksilverIdentity.sides[0].abilities.find(({name}) =>
            name === 'Hermanos con superpoderes');

        assert.ok(match.inPlayCards.some(card =>
            card.name === 'Wanda Maximoff' && card.isAlterEgo));

        await ability.effect.runEffect({player});

        assert.deepEqual(drawCounts, [3]);
    });

    test('Por partida doble repeats the choice and resolves each selection', async () => {
        const {heroes} = await loadCatalog();
        const quicksilver = heroes.find(({_id}) => _id === 'quicksilver');
        const match = new Match({
            mc: {mcSocket: {send() {}}},
            name: 'quicksilver-double-time-test',
        });
        match.isUniqueCard = () => false;
        const matchFactory = new MatchFactory(match);
        const superhero = matchFactory.createSuperhero({
            ...quicksilver.config,
            precon: [],
        });
        const player = match.createPlayer({
            name: 'Pietro Maximoff',
            superhero,
        });
        player.initPlayer();
        superhero.selectedSide = 1;
        const event = createGameCard(
            matchFactory.cardsFactory,
            getCardEntry(quicksilver, 'Por partida doble').card
        );
        const repeatEffect = event.abilities[0].effect;
        const originalParseEffect =
            match.effectsFactory.parseEffect.bind(match.effectsFactory);
        let dialogCount = 0;
        const choiceSelections = [0, 1, 0, 0];
        const resolvedOptions = [];

        match.openDialog = async ({dialogType}) => {
            assert.equal(dialogType, DIALOG_LIST);
            return {selected: {id: choiceSelections[dialogCount++]}};
        };
        match.effectsFactory.parseEffect = definition => {
            const effect = originalParseEffect(definition);

            if (definition.type === EFFECT_CHOOSE_ABILITY) {
                effect.options.forEach((option, index) => {
                    option.canRun = async () => true;
                    option.resolveAbility = async () =>
                        resolvedOptions.push(index);
                });
                effect.runEffect = async params => {
                    await effect.execute(params);
                    effect.resolved = true;
                    effect.fullResolved = true;
                };
            }

            return effect;
        };

        await repeatEffect.runEffect({match, player, card: event});

        assert.equal(dialogCount, 2);
        assert.deepEqual(resolvedOptions, [0, 1]);

        const repeatedChoice = createGameCard(
            matchFactory.cardsFactory,
            getCardEntry(quicksilver, 'Por partida doble').card
        );
        await repeatedChoice.abilities[0].effect.runEffect({
            match,
            player,
            card: repeatedChoice,
        });

        assert.equal(dialogCount, 4);
        assert.deepEqual(resolvedOptions, [0, 1, 0, 0]);
    });

    test('all configured card abilities compile to runnable effects', async () => {
        const catalog = await loadCatalog();
        const {heroes} = catalog;
        const quicksilver = heroes.find(({_id}) => _id === 'quicksilver');
        const cardsFactory = new MatchFactory({triggerCards: {}}).cardsFactory;
        const sharedCardIds = new Set([
            'basic-orden-y-caos',
            'basic-descarga-adrenalina',
            'basic-deber-civico',
            'protection-hombre-multiple',
            'protection-warlock',
            'protection-ni-un-paso-atras',
            'protection-esquiva-lateral',
            'protection-nervios-de-acero',
        ]);
        const configuredCards = [
            ...quicksilver.config.cards.map(({card}) => card),
            ...quicksilver.config.nemesis.map(({card}) => card),
            quicksilver.config.obligation.card,
            ...catalog.aspects
                .filter(({_id}) => sharedCardIds.has(_id))
                .map(({card}) => card),
        ];

        for (const card of configuredCards) {
            const gameCard = createGameCard(cardsFactory, card);
            const abilities = [
                ...gameCard.abilities,
                ...(gameCard.boostAbility ? [gameCard.boostAbility] : []),
            ];
            for (const ability of abilities) {
                if (ability.effect) {
                    assert.equal(
                        typeof ability.effect.canRun,
                        'function',
                        `${card.params.name}: ${ability.name}`
                    );
                }
            }
        }

        const earthquake = configuredCards.find(({params}) =>
            params.name === 'Terremoto');
        const earthquakeGameCard = createGameCard(cardsFactory, earthquake);
        const [payResources, exhaustHero] =
            earthquakeGameCard.boostAbility.effect.options;
        assert.equal(earthquakeGameCard.boostAbility.abilityType, ABILITY_BOOST);
        assert.equal(earthquakeGameCard.boostAbility.effect.effectType, 'choose-ability');
        assert.equal(payResources.arrow.cost.effectType, EFFECT_SPEND);
        assert.deepEqual(payResources.arrow.cost.resources, [
            RESOURCE_PHYSICAL,
            RESOURCE_PHYSICAL,
        ]);
        assert.equal(exhaustHero.effect.effectType, EFFECT_EXHAUST);
    });

    test('Vivir con prisa keeps the ready restriction after discarding itself', async () => {
        const {heroes} = await loadCatalog();
        const quicksilver = heroes.find(({_id}) => _id === 'quicksilver');
        const cardsFactory = new MatchFactory({triggerCards: {}}).cardsFactory;
        const obligation = createGameCard(
            cardsFactory,
            quicksilver.config.obligation.card
        );
        const choose = obligation.abilities.find(({name}) =>
            name === 'Resolver la obligación').effect;
        const lasting = choose.options[1].effect.effects[1];
        const cannot = lasting.effect;

        assert.equal(lasting.until, TRIGGER_PLAYER_TURN_END);
        assert.equal(lasting.triggerType, TRIGGER_PLAYER_CAN_READY);
        assert.equal(cannot.effectType, EFFECT_CANNOT);
        assert.equal(cannot.restriction, 'ready');
        assert.equal(cannot.sourceIn, undefined);
        assert.deepEqual(cannot.targetCondition, {isSuperhero: true});
        assert.equal(
            choose.options[1].effect.effects[2].effectType,
            EFFECT_DISCARD_GAME
        );
    });

    test('Vivir con prisa prevents readying after it is discarded until the next turn ends', async () => {
        const {heroes} = await loadCatalog();
        const quicksilver = heroes.find(({_id}) => _id === 'quicksilver');
        const match = new Match({
            mc: {mcSocket: {send() {}}},
            name: 'quicksilver-obligation-test',
        });
        match.isUniqueCard = () => false;
        const matchFactory = new MatchFactory(match);
        const superhero = matchFactory.createSuperhero({
            ...quicksilver.config,
            precon: [],
        });
        const scenarioDiscardPile = [];
        match.scenario = {
            deck: {
                discardPile: scenarioDiscardPile,
                async discard(card) {
                    scenarioDiscardPile.push(card);
                },
                async refresh() {},
            },
        };
        const player = match.createPlayer({
            name: 'Pietro Maximoff',
            superhero,
        });
        player.initPlayer();
        player.gameZone.refresh = async () => {};
        player.hand.refresh = async () => {};
        player.deck.refresh = async () => {};
        player.deck.checkCycle = async () => {};

        const obligation = superhero.obligations.find(card =>
            card.name === 'Vivir con prisa');
        obligation.owner = player;
        player.addToGameZone(obligation);
        const resolver = obligation.abilities.find(ability =>
            ability.name === 'Resolver la obligación');
        const [exhaustPietro] = resolver.effect.options;
        const option = resolver.effect.options[1];

        superhero.selectedSide = 1;
        assert.equal(
            await exhaustPietro.canRun({card: obligation, match, player}),
            false
        );
        superhero.selectedSide = 0;
        assert.equal(
            await exhaustPietro.canRun({card: obligation, match, player}),
            true
        );
        superhero.selectedSide = 1;

        await option.resolveAbility({card: obligation, match, player});

        assert.equal(superhero.exhausted, true);
        assert.equal(player.gameZone.cards.includes(obligation), false);
        assert.equal(scenarioDiscardPile.includes(obligation), true);
        assert.equal(match.lasting.length, 1);
        assert.equal(await player.canReady({card: superhero}), false);

        const turnEnd = new PlayTurnEffect({match});
        await turnEnd.trigger(
            PRIORITY_CONSTANT,
            [TRIGGER_PLAYER_TURN_END],
            {player}
        );

        assert.equal(match.lasting.length, 0);
        assert.equal(await player.canReady({card: superhero}), true);
    });

    test('the hurricane event pays X resources and uses that count for stuns', async () => {
        const {heroes} = await loadCatalog();
        const quicksilver = heroes.find(({_id}) => _id === 'quicksilver');
        const hurricane = getCardEntry(quicksilver, 'Velocidad de huracán').card;
        const matchFactory = new MatchFactory({triggerCards: {}});
        const cardsFactory = matchFactory.cardsFactory;
        const gameCard = createGameCard(cardsFactory, hurricane);
        const [ability] = gameCard.abilities;
        const effect = ability.effect;
        const playCardEffect = {resourcesPaid: [RESOURCE_MENTAL, RESOURCE_PHYSICAL]};

        assert.equal(hurricane.params.cost, RESOURCES_X);
        assert.ok(effect instanceof StunEffect);
        assert.equal(effect.selectUpTo, false);
        assert.deepEqual(effect.targetCountCalc, {
            target: 'playCardEffect.resourcesPaid',
            formula: CALC_COUNT,
        });

        const resolvedParams = await effect.resolveParams({
            match: matchFactory.match,
            playCardEffect,
        });
        assert.equal(resolvedParams.selectCount, 2);

        const enemies = ['enemy-1', 'enemy-2', 'enemy-3'].map(id => ({
            id,
            toObj: () => ({id}),
        }));
        effect.validTarget.getValidTarget = () => enemies;
        effect.validTarget.openDialog = async ({data}) => {
            assert.equal(data.count, 2);
            assert.equal(data.minCount, 2);
            assert.equal(data.upTo, false);
            return {selected: [{id: 'enemy-1'}, {id: 'enemy-3'}]};
        };
        assert.deepEqual(
            await effect.selectTarget(resolvedParams),
            [enemies[0], enemies[2]]
        );
    });

    test('Terremoto discards two cards, one card, or none based on the hand size', async () => {
        const {heroes} = await loadCatalog();
        const quicksilver = heroes.find(({_id}) => _id === 'quicksilver');
        const match = new Match({
            mc: {mcSocket: {send() {}}},
            name: 'quicksilver-earthquake-test',
        });
        match.isUniqueCard = () => false;
        const matchFactory = new MatchFactory(match);
        const superhero = matchFactory.createSuperhero({
            ...quicksilver.config,
            precon: [],
        });
        const player = match.createPlayer({
            name: 'Pietro Maximoff',
            superhero,
        });
        player.initPlayer();
        player.hand.refresh = async () => {};
        player.deck.refresh = async () => {};
        player.deck.checkCycle = async () => {};

        const earthquakeConfig = quicksilver.config.nemesis.find(({card}) =>
            card.params.name === 'Terremoto').card;
        const handCardConfig = quicksilver.config.cards.find(({card}) =>
            card.params.name === 'Siempre corriendo').card;
        for (const handSize of [0, 1, 2]) {
            const earthquake = createGameCard(
                matchFactory.cardsFactory,
                earthquakeConfig
            );
            const discardEffect = earthquake.abilities.find(({isWhenRevealed}) =>
                isWhenRevealed).effect.effects[0];
            const discardCountBefore = player.deck.discardPile.length;
            let dialogCount = 0;

            for (let index = 0; index < handSize; index++) {
                const handCard = matchFactory.cardsFactory.createGameCard({
                    card: matchFactory.cardsFactory.createCard(handCardConfig),
                    index: handSize * 10 + index,
                    owner: player,
                });
                player.hand.addCard(handCard);
            }

            match.openDialog = async ({data}) => {
                dialogCount = data.count;
                return {selected: data.cards.slice(0, data.count)};
            };
            await discardEffect.runEffect({match, player, card: earthquake});

            assert.equal(player.hand.cards.length, 0);
            assert.equal(
                player.deck.discardPile.length - discardCountBefore,
                handSize
            );
            assert.equal(dialogCount, handSize === 0 ? 0 : handSize);
        }
    });

    test('Terremoto boost asks again after its resource-payment choice is cancelled', async () => {
        const catalog = await loadCatalog();
        const quicksilver = catalog.heroes.find(({_id}) => _id === 'quicksilver');
        const match = new Match({
            mc: {mcSocket: {send() {}}},
            name: 'quicksilver-earthquake-boost-cancel-test',
        });
        const matchFactory = new MatchFactory(match);
        const superhero = matchFactory.createSuperhero({
            ...quicksilver.config,
            precon: [],
        });
        const player = match.createPlayer({
            name: 'Pietro Maximoff',
            superhero,
        });
        player.initPlayer();
        superhero.selectedSide = 1;

        const physicalResource = getAspectEntry(
            catalog,
            'protection-ni-un-paso-atras'
        ).card;
        for (let index = 0; index < 2; index++) {
            player.hand.cards.push(
                matchFactory.cardsFactory.createGameCardFromConfig(
                    physicalResource,
                    {index, owner: player}
                )
            );
        }

        const earthquake = createGameCard(
            matchFactory.cardsFactory,
            quicksilver.config.nemesis.find(({card}) =>
                card.params.name === 'Terremoto').card
        );
        const dialogs = [];
        match.openDialog = async dialog => {
            dialogs.push(dialog);
            if (dialog.dialogType === DIALOG_PAY_COST) {
                return undefined;
            }

            assert.equal(dialog.dialogType, DIALOG_LIST);
            return {
                selected: {
                    id: dialogs.filter(({dialogType}) =>
                        dialogType === DIALOG_LIST).length === 1 ? 0 : 1,
                },
            };
        };

        await earthquake.boostAbility.resolveAbility({
            card: earthquake,
            match,
            player,
        });

        const choiceDialogs = dialogs.filter(({dialogType}) =>
            dialogType === DIALOG_LIST);
        assert.equal(choiceDialogs.length, 2);
        assert.equal(
            dialogs.filter(({dialogType}) =>
                dialogType === DIALOG_PAY_COST).length,
            1
        );
        assert.deepEqual(choiceDialogs.map(({data}) =>
            data.options.map(({text}) => text)), [
            ['Gasta 2 recursos físicos', 'Agota tu carta de Superhéroe'],
            ['Gasta 2 recursos físicos', 'Agota tu carta de Superhéroe'],
        ]);
        assert.equal(superhero.currentSide.exhausted, true);
        assert.equal(player.hand.cards.length, 2);
    });

    test('Ni un paso atrás stuns the attacker when Esquiva lateral prevents all damage', async () => {
        const catalog = await loadCatalog();
        const quicksilver = catalog.heroes.find(({_id}) => _id === 'quicksilver');
        const match = new Match({
            mc: {mcSocket: {send() {}}},
            name: 'quicksilver-prevented-defense-damage-test',
        });
        const matchFactory = new MatchFactory(match);
        const superhero = matchFactory.createSuperhero({
            ...quicksilver.config,
            precon: [],
        });
        const player = match.createPlayer({
            name: 'Pietro Maximoff',
            superhero,
        });
        player.initPlayer();
        superhero.selectedSide = 1;
        player.canDefend = async () => true;
        player.canPlayCard = async () => true;

        const hero = superhero.sides[1];
        const attacker = {
            isEnemy: true,
            isInPlay: true,
            isMinion: true,
            isStunned: false,
            name: 'Minion de prueba',
            async getAttackValue() {
                return 3;
            },
            stun() {
                this.isStunned = true;
            },
            async refresh() {},
        };
        match.scenario = {villain: attacker};
        const noStepBack = matchFactory.cardsFactory.createGameCardFromConfig(
            getAspectEntry(catalog, 'protection-ni-un-paso-atras').card,
            {owner: player}
        );
        const sideStep = matchFactory.cardsFactory.createGameCardFromConfig(
            getAspectEntry(catalog, 'protection-esquiva-lateral').card,
            {owner: player}
        );
        sideStep.canPlay = async () => true;
        player.hand.cards.push(sideStep);
        await sideStep.initTriggers();

        const dialogs = [];
        match.openDialog = async dialog => {
            dialogs.push(dialog);
            assert.equal(dialog.dialogType, DIALOG_USE_CARD);
            return {selected: {id: sideStep.id}};
        };
        player.triggerEvent = async (trigger, params) => {
            const ability = trigger.ability;
            await ability.resolveAbility({
                ...params,
                arrowPaid: true,
                card: trigger.card,
                player,
                playCardEffect: {resourcesPaid: [RESOURCE_MENTAL]},
            });

            return {
                triggered: ability.resolved,
                paymentCancelled: ability.paymentCancelled,
            };
        };

        const attack = new EnemyAttackEffect({
            enemy: attacker,
            giveBoost: false,
            match,
            selectedTarget: hero,
        });
        attack.defense = async () => {
            attack.defender = hero;
            await noStepBack.abilities[0].resolveAbility({
                arrowPaid: true,
                card: noStepBack,
                effect: attack,
                player,
            });
            attack.defValue = 2;
        };

        await attack.execute({match, player});

        assert.equal(attack.defValue, 2);
        assert.equal(attack.activation.takenDamage, 0);
        assert.equal(attacker.isStunned, true);
        assert.equal(dialogs.length, 1);
    });

    test('X costs require resource payment and consume every selected icon', async () => {
        const card = {cost: RESOURCES_X, name: 'Velocidad de huracán'};
        const getCostEffect = new GetCostEffect({
            selectedTarget: card,
            match: {},
        });
        await getCostEffect.execute({});
        assert.equal(getCostEffect.cost, RESOURCES_X);

        const playCardEffect = new PlayCardEffect({card, match: {}});
        playCardEffect.getCost = async () => RESOURCES_X;
        const resourceCost = await playCardEffect.getResourceCost({card});
        assert.equal(resourceCost.amount, RESOURCES_X);
        assert.equal(resourceCost.requiresPayment, true);
        assert.deepEqual(resourceCost.getRequiredResources(), []);

        const resourceCard = {
            id: 'double-resource',
            card: {
                getResources: () => [RESOURCE_MENTAL, RESOURCE_PHYSICAL],
            },
        };
        const paymentEffect = {resourceCost};
        const session = new CostPaymentSession();
        session.stagePayment(paymentEffect, {
            generators: [],
            hand: [resourceCard],
            resources: [RESOURCE_MENTAL, RESOURCE_PHYSICAL],
        }, {card});

        assert.deepEqual(session.getPayment(paymentEffect).resources, [
            RESOURCE_MENTAL,
            RESOURCE_PHYSICAL,
        ]);
        assert.deepEqual(
            session.getRemainingResources().get(resourceCard.id),
            []
        );
    });

    test('ready responses only fire for characters actually readied', async () => {
        const {heroes} = await loadCatalog();
        const quicksilver = heroes.find(({_id}) => _id === 'quicksilver');
        const cardsFactory = new MatchFactory({triggerCards: {}}).cardsFactory;
        const frictionResistance = createGameCard(
            cardsFactory,
            getCardEntry(quicksilver, 'Resistencia a la fricción').card
        );
        const response = frictionResistance.abilities.find(({trigger}) =>
            trigger === TRIGGER_CHARACTER_READIED);
        const mercurio = {
            exhausted: true,
            name: 'Mercurio',
            async ready() {
                this.exhausted = false;
            },
            async refresh() {},
        };
        const effect = new ReadyEffect({
            selectedTarget: mercurio,
            match: {},
        });

        await effect.prepare({});
        await effect.execute({});
        assert.deepEqual(effect.readiedTargets, [mercurio]);
        assert.ok(effect.getTriggersEnds({}).includes(TRIGGER_CHARACTER_READIED));
        assert.equal(checkCondition({effect}, response.condition), true);

        const alreadyReady = new ReadyEffect({
            selectedTarget: {
                exhausted: false,
                name: 'Mercurio',
                async ready() {},
                async refresh() {},
            },
            match: {},
        });
        await alreadyReady.prepare({});
        await alreadyReady.execute({});
        assert.deepEqual(alreadyReady.readiedTargets, []);
        assert.ok(!alreadyReady.getTriggersEnds({}).includes(
            TRIGGER_CHARACTER_READIED
        ));
    });

    test('Friction Resistance readies after accepting its response to Mercurio readying', async () => {
        const {heroes} = await loadCatalog();
        const quicksilver = heroes.find(({_id}) => _id === 'quicksilver');
        const match = new Match({
            mc: {mcSocket: {send() {}}},
            name: 'quicksilver-friction-ready-test',
        });
        match.scenario = {
            villain: {
                isEnemy: true,
                isVillain: true,
                canBeAttacked: () => true,
            },
        };
        const matchFactory = new MatchFactory(match);
        const superhero = matchFactory.createSuperhero(quicksilver.config);
        const player = match.createPlayer({
            name: 'Pietro Maximoff',
            superhero,
        });
        player.initPlayer();
        superhero.selectedSide = 1;
        const mercurio = superhero.sides[1];
        mercurio.exhausted = true;
        player.canReady = async () => true;
        const frictionResistance = matchFactory.cardsFactory.createGameCardFromConfig(
            getCardEntry(quicksilver, 'Resistencia a la fricción').card,
            {owner: player}
        );
        player.addToGameZone(frictionResistance);
        frictionResistance.exhausted = true;
        await frictionResistance.initTriggers();
        assert.ok(match.triggerCards[frictionResistance.id]);

        const dialogs = [];
        match.openDialog = async dialog => {
            dialogs.push(dialog);
            return {selected: {id: frictionResistance.id}};
        };
        const readyEffect = new ReadyEffect({
            selectedTarget: mercurio,
            match,
        });

        await readyEffect.runEffect({player});

        assert.equal(mercurio.exhausted, false);
        assert.equal(
            dialogs.length,
            1,
            JSON.stringify(dialogs.map(({dialogType, data}) => ({
                dialogType,
                cards: data?.cards,
            })))
        );
        assert.equal(dialogs[0].dialogType, DIALOG_USE_CARD);
        assert.ok(dialogs[0].data.cards.some(({id}) =>
            id === frictionResistance.id));
        assert.equal(frictionResistance.exhausted, false);
    });

    test('Friction Resistance does not trigger during the simultaneous end-of-player-phase ready', async () => {
        const {heroes} = await loadCatalog();
        const quicksilver = heroes.find(({_id}) => _id === 'quicksilver');
        const match = new Match({
            mc: {mcSocket: {send() {}}},
            name: 'quicksilver-friction-simultaneous-ready-test',
        });
        match.scenario = {
            villain: {
                isEnemy: true,
                isVillain: true,
                canBeAttacked: () => true,
            },
        };
        const matchFactory = new MatchFactory(match);
        const superhero = matchFactory.createSuperhero({
            ...quicksilver.config,
            precon: [],
        });
        const player = match.createPlayer({
            name: 'Pietro Maximoff',
            superhero,
        });
        player.initPlayer();
        player.getHandSize = async () => 0;
        player.canReady = async () => true;
        superhero.selectedSide = 1;
        const mercurio = superhero.sides[1];
        mercurio.exhaust();

        const frictionResistance = matchFactory.cardsFactory.createGameCardFromConfig(
            getCardEntry(quicksilver, 'Resistencia a la fricción').card,
            {owner: player}
        );
        player.addToGameZone(frictionResistance);
        frictionResistance.exhausted = true;
        await frictionResistance.initTriggers();

        const dialogs = [];
        match.openDialog = async dialog => {
            dialogs.push(dialog);
            return {selected: {id: frictionResistance.id}};
        };

        await player.runEndPlayersPhase({match, player}, []);

        assert.equal(mercurio.exhausted, false);
        assert.equal(frictionResistance.exhausted, false);
        assert.equal(
            dialogs.filter(({dialogType}) =>
                dialogType === DIALOG_USE_CARD).length,
            0
        );
    });

    test('Scarlet Witch converts discarded boost icons into the matching stat', async () => {
        const {heroes} = await loadCatalog();
        const quicksilver = heroes.find(({_id}) => _id === 'quicksilver');
        const cardsFactory = new MatchFactory({triggerCards: {}}).cardsFactory;
        const wanda = createGameCard(
            cardsFactory,
            getCardEntry(quicksilver, 'Bruja Escarlata').card
        );
        const attackInterrupt = wanda.abilities.find(({trigger}) =>
            trigger === TRIGGER_THIS_ATTACK);
        const thwartInterrupt = wanda.abilities.find(({trigger}) =>
            trigger === TRIGGER_THIS_THWARTS);

        assert.equal(attackInterrupt.abilityType, ABILITY_INTERRUPT);
        assert.equal(thwartInterrupt.abilityType, ABILITY_INTERRUPT);
        assert.equal(attackInterrupt.effect.effectType, EFFECT_CHAINED);
        assert.deepEqual(attackInterrupt.condition, {
            'effect.ability.isBasic': true,
        });
        assert.deepEqual(thwartInterrupt.condition, {
            'effect.ability.isBasic': true,
        });
        const attackCount = attackInterrupt.effect.effects[1];
        const attackModifier = attackInterrupt.effect.effects[2];
        assert.equal(attackCount.effectType, EFFECT_COUNT_BOOST_ICONS);
        assert.equal(attackCount.cardSource, 'effects.0.cards.0');
        assert.equal(attackModifier.effectType, EFFECT_MODIFY_ATTACK_VALUE);
        assert.deepEqual(attackModifier.paramsCalc, {
            target: 'effects.1.value',
            formula: CALC_ALL,
        });
        assert.equal(await attackModifier.calculate({
            effects: [{}, {value: 2}],
        }), 2);
        assert.equal(
            thwartInterrupt.effect.effects[1].effectType,
            EFFECT_COUNT_BOOST_ICONS
        );
        assert.equal(thwartInterrupt.effect.effects[2].paramsCalc.formula, CALC_ALL);
        assert.equal(thwartInterrupt.effect.effects[0].count, 1);
    });

    test('Scarlet Witch interrupts actual attacks and thwarts, not stat reads', async () => {
        const {heroes} = await loadCatalog();
        const quicksilver = heroes.find(({_id}) => _id === 'quicksilver');
        const encounterCards = [2, 1, 2].map(boost => ({
            boost,
            toObj() {
                return {boost: this.boost};
            },
        }));
        const deck = {
            cards: encounterCards.slice(),
            async discardTopCards(count) {
                return this.cards.splice(0, count);
            },
            async refresh() {},
        };
        const match = new Match({
            mc: {mcSocket: {send() {}}},
            name: 'quicksilver-wanda-basic-attributes-test',
        });
        match.scenario = {deck};
        const matchFactory = new MatchFactory(match);
        const superhero = matchFactory.createSuperhero(quicksilver.config);
        const player = match.createPlayer({
            name: 'Pietro Maximoff',
            superhero,
        });
        player.initPlayer();
        superhero.selectedSide = 1;
        const wanda = matchFactory.cardsFactory.createGameCardFromConfig(
            getCardEntry(quicksilver, 'Bruja Escarlata').card,
            {owner: player}
        );
        player.addToGameZone(wanda);
        await wanda.initTriggers();
        const scarletWitchAttackTrigger =
            wanda.triggers[TRIGGER_THIS_ATTACK][PRIORITY_INTERRUPT][0];
        const dialogs = [];
        match.openDialog = async dialog => {
            dialogs.push(dialog);
            return dialog.dialogType === DIALOG_USE_CARD ?
                {selected: {id: wanda.id}} :
                {};
        };

        assert.equal(await wanda.getAttackValue({player}), 1);
        assert.equal(await wanda.getThwartValue({player}), 1);
        assert.equal(dialogs.length, 0);

        const attackEffect = new DealDamageEffect({
            match,
            ability: {isBasic: true, character: wanda},
            isAttack: true,
            damage: 1,
        });
        const thwartEffect = new RemoveThreatEffect({
            match,
            ability: {isBasic: true, character: wanda},
            isThwart: true,
            threat: 1,
        });
        await attackEffect.triggerInit(attackEffect.getTriggersParams({
            match,
            player,
        }));
        assert.equal(attackEffect.modifyAttack, 2);
        assert.ok(scarletWitchAttackTrigger.hasTriggeredFor(attackEffect));
        attackEffect.resetResolutionState();
        attackEffect.resetActivation();
        assert.ok(!scarletWitchAttackTrigger.hasTriggeredFor(attackEffect));
        const secondAttackParams = attackEffect.getTriggersParams({
            match,
            player,
        });
        assert.ok(await scarletWitchAttackTrigger.canTrigger(secondAttackParams));
        await attackEffect.triggerInit(secondAttackParams);
        assert.equal(
            dialogs.filter(({dialogType}) =>
                dialogType === DIALOG_USE_CARD).length,
            2,
            JSON.stringify(dialogs.map(({dialogType, data}) => ({
                dialogType,
                cards: data?.cards,
            })))
        );
        assert.equal(attackEffect.modifyAttack, 1);
        await thwartEffect.triggerInit(thwartEffect.getTriggersParams({
            match,
            player,
        }));
        assert.equal(thwartEffect.modifyThwart, 2);
        assert.equal(
            dialogs.filter(({dialogType}) =>
                dialogType === DIALOG_USE_CARD).length,
            3
        );
        assert.deepEqual(deck.cards, []);

        const mercurioAttack = new DealDamageEffect({
            match,
            ability: {isBasic: true, character: superhero.sides[1]},
            isAttack: true,
            damage: 1,
        });
        await mercurioAttack.triggerInit(mercurioAttack.getTriggersParams({
            match,
            player,
        }));
        assert.equal(mercurioAttack.modifyAttack ?? 0, 0);
        assert.equal(
            dialogs.filter(({dialogType}) =>
                dialogType === DIALOG_USE_CARD).length,
            3
        );
    });

    test('Descarga de adrenalina and Deber cívico confirm before paying their discard cost', async () => {
        const catalog = await loadCatalog();
        const quicksilver = catalog.heroes.find(({_id}) => _id === 'quicksilver');
        const match = new Match({
            mc: {mcSocket: {send() {}}},
            name: 'quicksilver-basic-upgrade-confirmation-test',
        });
        match.scenario = {
            villain: {
                isEnemy: true,
                isVillain: true,
                canBeAttacked: () => true,
            },
        };
        const matchFactory = new MatchFactory(match);
        const superhero = matchFactory.createSuperhero(quicksilver.config);
        const player = match.createPlayer({
            name: 'Pietro Maximoff',
            superhero,
        });
        player.initPlayer();
        superhero.selectedSide = 1;
        const hero = superhero.sides[1];
        const confirmations = [false, true, false, true];
        const dialogs = [];
        match.openDialog = async dialog => {
            dialogs.push(dialog);
            return {confirmed: confirmations.shift()};
        };

        for (const [id, name, stat] of [
            ['basic-descarga-adrenalina', 'Descarga de adrenalina', 'modifyAttack'],
            ['basic-deber-civico', 'Deber cívico', 'modifyThwart'],
        ]) {
            const upgrade = matchFactory.cardsFactory.createGameCardFromConfig(
                getAspectEntry(catalog, id).card,
                {owner: player}
            );
            player.addToGameZone(upgrade);
            const ability = upgrade.abilities[0];
            assert.equal(ability.effect.effectType, EFFECT_MAY);
            assert.equal(ability.effect.requiresPrePlayConfirmation, true);

            await upgrade.resolveAbility({abilityIndex: 0, player});
            assert.equal(player.gameZone.cards.includes(upgrade), true);
            assert.equal(hero[stat] ?? 0, 0);

            await upgrade.resolveAbility({abilityIndex: 0, player});
            assert.equal(player.gameZone.cards.includes(upgrade), false);
            assert.equal(hero[stat], 1, `${name} applies its bonus after confirmation`);
        }

        assert.deepEqual(dialogs.map(({title}) => title), [
            '¿Quieres descartar Descarga de adrenalina para recibir +1 ATQ?',
            '¿Quieres descartar Descarga de adrenalina para recibir +1 ATQ?',
            '¿Quieres descartar Deber cívico para recibir +1 INT?',
            '¿Quieres descartar Deber cívico para recibir +1 INT?',
        ]);
    });

    test('identity and upgrade abilities keep their phase limits and stat triggers', async () => {
        const {heroes} = await loadCatalog();
        const quicksilver = heroes.find(({_id}) => _id === 'quicksilver');
        const matchFactory = new MatchFactory({triggerCards: {}});
        const superhero = matchFactory.createSuperhero(quicksilver.config);
        const speedAbility = superhero.sides[1].abilities.find(({name}) =>
            name === 'Supervelocidad');

        assert.equal(speedAbility.abilityType, ABILITY_HERO_RESPONSE);
        assert.deepEqual(speedAbility.trigger, [
            TRIGGER_YOU_BASIC_THWART,
            TRIGGER_YOU_BASIC_ATTACK,
            TRIGGER_YOU_BASIC_DEFENSE,
        ]);
        assert.equal(speedAbility.limit.count, 1);
        assert.equal(speedAbility.limit.target, TARGET_PHASE);

        const upgrades = [
            ['Reflejos acelerados', 'YOUR_HERO_GET_DEFENSE'],
            ['Percepción superior', 'YOUR_HERO_GET_THWART'],
            ['Tendones reforzados', 'YOUR_HERO_GET_ATTACK'],
        ];
        for (const [name, trigger] of upgrades) {
            const ability = createGameCard(
                matchFactory.cardsFactory,
                getCardEntry(quicksilver, name).card
            ).abilities[0];
            assert.equal(ability.abilityType, 'constant');
            assert.equal(ability.trigger, trigger);
            assert.equal(ability.condition['effect.selectedTarget.name'], 'Mercurio');
        }

        const pietroAbility = superhero.sides[0].abilities.find(({name}) =>
            name === 'Hermanos con superpoderes');
        assert.equal(pietroAbility.limit.count, 1);
        assert.equal(pietroAbility.limit.target, TARGET_ROUND);
        assert.equal(pietroAbility.effect.checkCondition({
            match: {inPlayCards: [{
                name: 'Bruja Escarlata',
                card: {subtitle: 'Wanda Maximoff'},
            }]},
        }), true);
        assert.equal(pietroAbility.effect.checkCondition({
            match: {inPlayCards: [{name: 'Wanda Maximoff'}]},
        }), true);
        assert.equal(pietroAbility.effect.checkCondition({
            match: {inPlayCards: [{
                name: 'Bruja Escarlata',
                card: {subtitle: 'Otra persona'},
            }]},
        }), false);
    });

    test('Serval returns only Mercurio cards and shuffles them into the deck', async () => {
        const {heroes} = await loadCatalog();
        const quicksilver = heroes.find(({_id}) => _id === 'quicksilver');
        const serval = getCardEntry(quicksilver, 'Industrias Serval').card;
        const [search, move] = serval.params.abilities[0].params.effect.params.effects;

        assert.deepEqual(search.params.filter, {set: 'Mercurio'});
        assert.equal(search.params.count, 2);
        assert.equal(search.params.upTo, true);
        assert.equal(move.params.position, DECK_POSITION_SHUFFLE);
        assert.equal(move.params.cards, 'selectedCards');
    });
});
