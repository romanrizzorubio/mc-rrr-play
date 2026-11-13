import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    ABILITY_ACTION,
    CARD_TYPE_ALTEREGO,
    CARD_TYPE_ATTACHMENT,
    CARD_TYPE_HERO,
    CARD_TYPE_MINION,
    CARD_TYPE_OBLIGATION,
    CARD_TYPE_RESOURCE,
    CARD_TYPE_SIDE_SCHEME_SCENARIO,
    CARD_TYPE_TREACHERY,
    CARD_TYPE_UPGRADE,
    CLASSIFICATION_AGGRESSION,
    DIALOG_DISCARD_ORDER,
    DIALOG_PAY_COST,
    DIALOG_REVEAL_CARDS,
    DIALOG_SELECT_TARGET,
    DIALOG_USE_CARD,
    EFFECT_CHOOSE_ABILITY,
    EFFECT_CHAINED,
    EFFECT_DISCARD_GAME,
    EFFECT_DO_IF,
    EFFECT_PLACE_DAMAGE,
    EFFECT_MOVE_COUNTERS,
    EFFECT_REMOVE_CARD,
    EFFECT_SURGE,
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    RESOURCE_WILD,
    TARGET_ALL_UPGRADES_YOU_CONTROL,
    TRAIT_GENIUS,
    TRAIT_GUARDIAN,
    TRAIT_OUTLAW,
    TRAIT_TECH,
    TRIGGER_INSTANT,
    TRIGGER_THIS_SPEND,
    TRIGGER_YOU_DEAL_DAMAGE,
} from 'mc-shared';
import {EVENTS} from 'mc-endpoints';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import rhino from '../../../mc-data/seed/catalog/scenarios/rhino.js';
import {DealDamageEffect} from '../../src/effects/deal-damage-effect.js';
import {FlipEffect} from '../../src/effects/flip-effect.js';
import {PayCostEffect} from '../../src/effects/pay-cost-effect.js';
import {PlayCardEffect} from '../../src/effects/play-card-effect.js';
import {PutFacedownCardInPlayEffect} from '../../src/effects/put-facedown-card-in-play-effect.js';
import {PutPlayEffect} from '../../src/effects/put-play-effect.js';
import {RevealEncounterEffect} from '../../src/effects/reveal-encounter-effect.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';
import {DialogSocket} from '../../src/server/socket/dialog-socket.js';
import {TakeDamageEffect} from '../../src/effects/take-damage-effect.js';
import {CostPaymentSession} from '../../src/utils/cost-payment-session.js';

describe('Mapache Cohete', () => {
    const getRocketRacoon = async() => {
        const catalog = await loadCatalog();
        const rocket = catalog.heroes.find(({_id}) => _id === 'rocket-racoon');
        assert.ok(rocket, 'Mapache Cohete should be present in the hero catalog');

        return {rocket, aspects: catalog.aspects};
    };

    test('defines both identities, the hero set, and the specified precon cards', async() => {
        const {rocket, aspects} = await getRocketRacoon();
        const [alterEgo, hero] = rocket.config.sides;

        assert.equal(alterEgo.type, CARD_TYPE_ALTEREGO);
        assert.deepEqual(alterEgo.params.traits, [TRAIT_GENIUS, TRAIT_OUTLAW]);
        assert.deepEqual(
            [alterEgo.params.recovery, alterEgo.params.hitPoints, alterEgo.params.handSize],
            [3, 9, 6],
        );
        assert.equal(hero.type, CARD_TYPE_HERO);
        assert.deepEqual(hero.params.traits, [TRAIT_GUARDIAN]);
        assert.deepEqual(
            [hero.params.thwart, hero.params.attack, hero.params.defense,
                hero.params.hitPoints, hero.params.handSize],
            [2, 1, 1, 9, 5],
        );
        assert.deepEqual(
            rocket.config.cards.map(({count, card}) => [count, card.params.name]),
            [
                [2, 'Tengo un plan'],
                [2, 'Recarga'],
                [1, 'Mala baba'],
                [2, 'Reutilizar piezas'],
                [2, 'Batería auxiliar'],
                [1, 'Esqueleto cibernético'],
                [1, 'Cañón de partículas'],
                [1, 'Lanzacohetes'],
                [2, 'Pistola de Cohete'],
                [1, 'Aerobotas'],
            ],
        );
        assert.deepEqual(
            rocket.config.precon.map(({aspect, cardRefs}) => [aspect, cardRefs]),
            [
                [
                    undefined,
                    [
                        {id: 'basic-flora-y-fauna', count: 1},
                        {id: 'basic-energy', count: 1},
                        {id: 'basic-strength', count: 1},
                        {id: 'basic-genius', count: 1},
                        {id: 'basic-groot', count: 1},
                        {id: 'basic-botas-impulsoras', count: 3},
                    ],
                ],
                [
                    CLASSIFICATION_AGGRESSION,
                    [
                        {id: 'aggression-a-por-ellos', count: 2},
                        {id: 'aggression-entrar-en-combate', count: 3},
                        {id: 'aggression-asalto-implacable', count: 2},
                        {id: 'aggression-bicho', count: 1},
                        {id: 'aggression-buscando-problemas', count: 3},
                        {id: 'aggression-ensanamiento', count: 3},
                        {id: 'aggression-pistolon', count: 3},
                    ],
                ],
            ],
        );
        const preconCardIds = rocket.config.precon.flatMap(({cardRefs}) =>
            cardRefs.map(({id}) => id));
        assert.ok(preconCardIds.every(id =>
            aspects.some(({_id}) => _id === id)));
        assert.equal(rocket.config.obligation.count, 1);
        assert.equal(rocket.config.obligation.card.type, CARD_TYPE_OBLIGATION);
        assert.equal(
            rocket.config.obligation.card.params.name,
            'Crisis en Medio Mundo',
        );
        assert.equal(rocket.config.obligation.card.params.boost, 2);
        assert.equal(rocket.config.obligation.card.params.giveToOwner, true);
        assert.deepEqual(
            rocket.config.nemesis.map(({count, card}) => [
                count,
                card.type,
                card.params.name,
            ]),
            [
                [1, CARD_TYPE_SIDE_SCHEME_SCENARIO, 'Venganza personal'],
                [1, CARD_TYPE_MINION, 'Blackjack O\'Hare'],
                [1, CARD_TYPE_ATTACHMENT, 'Bazuca de Blackjack'],
                [2, CARD_TYPE_TREACHERY, 'Invasión planetaria'],
            ],
        );
        const [vengeance, blackjack] = rocket.config.nemesis;
        assert.deepEqual(vengeance.card.params.startingThreat, [2, true]);
        assert.deepEqual(vengeance.card.params.icons, {amplification: 1});
        assert.equal(blackjack.card.params.nemesis, true);
        assert.equal(blackjack.card.params.unique, true);
        assert.deepEqual(blackjack.card.params.keywords, {
            quickStrike: true,
            villainous: true,
        });
    });

    test('builds every ability and excludes the Battery itself from its transfer target', async() => {
        const {rocket} = await getRocketRacoon();
        const match = new Match({
            mc: {mcSocket: {send() {}}},
            name: 'Mapache Cohete ability setup',
        });
        const matchFactory = new MatchFactory(match);
        const superhero = matchFactory.createSuperhero({
            ...rocket.config,
            cards: [],
            obligation: undefined,
            precon: [],
            nemesis: [],
        });
        superhero.selectedSide = 1;
        superhero.refresh = async() => {};
        const player = match.createPlayer({
            name: 'Mapache Cohete',
            superhero,
            initial: true,
        });
        player.initPlayer();
        await superhero.initTriggers({match, player});

        for (const side of superhero.sides) {
            assert.ok(side.abilities.every(({effect}) =>
                effect && typeof effect.canRun === 'function'));
        }

        const obligationCard = matchFactory.cardsFactory.createGameCardFromConfig(
            rocket.config.obligation.card,
            {owner: player},
        );
        assert.ok(obligationCard.abilities.every(({effect}) =>
            effect && typeof effect.canRun === 'function'));
        assert.deepEqual(
            obligationCard.abilities.map(({trigger}) => trigger),
            [TRIGGER_INSTANT, TRIGGER_INSTANT],
        );
        assert.equal(
            obligationCard.abilities[1].effect.effectType,
            EFFECT_CHOOSE_ABILITY,
        );
        const [exhaustAlterEgo, discardUpgrade] =
            obligationCard.abilities[1].effect.options;
        assert.equal(exhaustAlterEgo.effect.effectType, EFFECT_REMOVE_CARD);
        assert.equal(discardUpgrade.effect.effectType, EFFECT_CHAINED);
        assert.equal(discardUpgrade.effect.effects[0].effectType, EFFECT_DISCARD_GAME);
        assert.equal(discardUpgrade.effect.effects[1].effectType, EFFECT_DO_IF);
        assert.equal(
            discardUpgrade.effect.effects[1].effect.effectType,
            EFFECT_SURGE,
        );

        const gameCards = rocket.config.cards.map(({card}) =>
            matchFactory.cardsFactory.createGameCardFromConfig(card, {
                owner: player,
            }));
        const nemesisCards = rocket.config.nemesis.map(({card}) =>
            matchFactory.cardsFactory.createGameCardFromConfig(card));
        assert.ok(nemesisCards.every(gameCard =>
            gameCard.abilities.every(({effect}) =>
                effect && typeof effect.canRun === 'function')));
        assert.equal(
            nemesisCards.find(({name}) => name === 'Invasión planetaria')
                .abilities[0].effect.effectType,
            EFFECT_CHAINED,
        );
        assert.ok(gameCards.every(gameCard =>
            gameCard.abilities.every(({effect}) =>
                effect && typeof effect.canRun === 'function')));

        const battery = gameCards.find(({name}) => name === 'Batería auxiliar');
        const pistol = gameCards.find(({name}) => name === 'Pistola de Cohete');
        const reload = gameCards.find(({name}) => name === 'Recarga');
        assert.equal(battery.card.type, CARD_TYPE_UPGRADE);
        assert.ok(battery.traits.includes(TRAIT_TECH));
        assert.equal(
            reload.abilities[0].effect.target,
            TARGET_ALL_UPGRADES_YOU_CONTROL,
        );
        assert.equal(
            Object.hasOwn(
                rocket.config.cards.find(({card}) =>
                    card.params.name === 'Recarga').card.params.abilities[0]
                        .params.effect.params,
                'multipleTarget',
            ),
            false,
        );
        assert.deepEqual(battery.card.resources, [RESOURCE_ENERGY]);
        assert.deepEqual(pistol.card.resources, [RESOURCE_ENERGY]);
        assert.deepEqual(
            rocket.config.cards.find(({card}) =>
                card.params.name === 'Reutilizar piezas').card.params.resources,
            [RESOURCE_MENTAL, RESOURCE_WILD],
        );
        assert.deepEqual(
            rocket.config.cards.find(({card}) =>
                card.params.name === 'Cañón de partículas').card.params.resources,
            [RESOURCE_MENTAL],
        );
        assert.deepEqual(
            rocket.config.cards.find(({card}) =>
                card.params.name === 'Lanzacohetes').card.params.resources,
            [RESOURCE_PHYSICAL],
        );

        battery.counters = 2;
        player.addToGameZone(battery);
        player.addToGameZone(pistol);
        const nonTechUpgrade = matchFactory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_UPGRADE,
            params: {name: 'Mejora sin Tecnología'},
        }, {owner: player});
        player.addToGameZone(nonTechUpgrade);
        const batteryAbility = battery.abilities.find(({effect}) =>
            effect.effectType === EFFECT_MOVE_COUNTERS);
        assert.ok(batteryAbility);
        const validSources = await batteryAbility.effect.getValidTarget({
            match,
            player,
        });
        const validDestinations = await batteryAbility.effect.getValidDestination(
            {match, player},
            battery,
        );

        assert.deepEqual(
            validSources.map(({name}) => name),
            ['Batería auxiliar'],
        );
        assert.deepEqual(
            validDestinations.map(({name}) => name),
            ['Pistola de Cohete'],
        );
    });

    test('Buscando problemas pays under Confused and thwarts normally otherwise', async() => {
        const {rocket, aspects} = await getRocketRacoon();
        const eventConfig = aspects.find(({_id}) =>
            _id === 'aggression-buscando-problemas')?.card;
        assert.ok(eventConfig);

        const match = new Match({
            mc: {mcSocket: {send() {}}},
            name: 'Confused Buscando problemas',
        });
        match.persist = async() => {};
        match.refresh = async() => {};
        match.openDialog = async() => ({});
        const matchFactory = new MatchFactory(match);
        const superhero = matchFactory.createSuperhero({
            ...rocket.config,
            cards: [],
            obligation: undefined,
            precon: [],
            nemesis: [],
        });
        superhero.selectedSide = 1;
        superhero.confused = 1;
        superhero.refresh = async() => {};
        const player = match.createPlayer({
            name: 'Mapache Cohete',
            superhero,
            initial: true,
        });
        player.initPlayer();
        player.refresh = async() => {};
        player.hand.refresh = async() => {};
        player.deck.refresh = async() => {};
        player.deck.cards.push(matchFactory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_RESOURCE,
            params: {name: 'Carta de prueba', resources: []},
        }, {owner: player}));

        const scenarioConfig = structuredClone(rhino.config);
        const scenario = await matchFactory.createScenario({
            ...scenarioConfig,
            cards: [],
            sets: [],
            defaultSets: [],
        });
        match.addScenario(scenario);
        await scenario.initScenario([], false);
        const mainScheme = scenario.mainScheme;
        const dialogs = [];
        match.openDialog = async dialog => {
            dialogs.push(dialog);

            return {selected: mainScheme};
        };
        mainScheme.threat = 4;

        const discardedEncounterCard =
            matchFactory.cardsFactory.createGameCardFromConfig({
                type: CARD_TYPE_TREACHERY,
                params: {name: 'Perfidia descartada', boost: 0},
            }, {owner: scenario});
        const remainingEncounterCard =
            matchFactory.cardsFactory.createGameCardFromConfig({
                type: CARD_TYPE_TREACHERY,
                params: {name: 'Perfidia restante', boost: 0},
            }, {owner: scenario});
        const minion = matchFactory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_MINION,
            params: {
                name: 'Esbirro encontrado',
                hitPoints: 3,
                attack: 1,
                scheme: 1,
            },
        }, {owner: scenario});
        scenario.deck.cards = [
            discardedEncounterCard,
            minion,
            remainingEncounterCard,
        ];

        const event = matchFactory.cardsFactory.createGameCardFromConfig(
            eventConfig,
            {owner: player},
        );
        player.hand.addCard(event);

        const playCardEffect = new PlayCardEffect({
            abilityType: ABILITY_ACTION,
            card: event,
            match,
        });
        await playCardEffect.runEffect({match, player});

        assert.equal(playCardEffect.played, true);
        assert.equal(player.hand.cards.includes(event), false);
        assert.equal(player.deck.discardPile.includes(event), true);
        assert.equal(superhero.isConfused, false);
        assert.equal(mainScheme.threat, 4);
        assert.ok(player.minions.includes(minion));
        assert.strictEqual(minion.engaged, player);
        assert.ok(scenario.deck.discardPile.includes(discardedEncounterCard));
        assert.ok(!scenario.deck.discardPile.includes(minion));
        assert.ok(scenario.deck.cards.includes(remainingEncounterCard));
        assert.deepEqual(
            dialogs.find(({dialogType}) =>
                dialogType === DIALOG_REVEAL_CARDS)?.data.cards.map(({name}) =>
                name),
            ['Perfidia descartada', 'Esbirro encontrado'],
        );

        const secondMinion = matchFactory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_MINION,
            params: {
                name: 'Segundo esbirro encontrado',
                hitPoints: 3,
                attack: 1,
                scheme: 1,
            },
        }, {owner: scenario});
        scenario.deck.cards.unshift(secondMinion);
        const secondEvent = matchFactory.cardsFactory.createGameCardFromConfig(
            eventConfig,
            {owner: player},
        );
        player.hand.addCard(secondEvent);
        dialogs.length = 0;

        const secondPlay = new PlayCardEffect({
            abilityType: ABILITY_ACTION,
            card: secondEvent,
            match,
        });
        await secondPlay.runEffect({match, player});

        assert.equal(secondPlay.played, true);
        assert.equal(player.deck.discardPile.includes(secondEvent), true);
        assert.equal(mainScheme.threat, 1);
        assert.ok(player.minions.includes(secondMinion));
        assert.deepEqual(
            dialogs.find(({dialogType}) =>
                dialogType === DIALOG_REVEAL_CARDS)?.data.cards.map(({name}) =>
                name),
            ['Segundo esbirro encontrado'],
        );
    });

    test('Reutilizar piezas responds when paid from hand without workInHand and clears after leaving hand', async() => {
        const {rocket} = await getRocketRacoon();
        const match = new Match({
            mc: {mcSocket: {send() {}}},
            name: 'Mapache Cohete resource response',
        });
        const matchFactory = new MatchFactory(match);
        const superhero = matchFactory.createSuperhero({
            ...rocket.config,
            cards: [],
            obligation: undefined,
            precon: [],
            nemesis: [],
        });
        superhero.selectedSide = 1;
        superhero.refresh = async() => {};
        const player = match.createPlayer({
            name: 'Mapache Cohete',
            superhero,
            initial: true,
        });
        player.initPlayer();
        match.openDialog = async({dialogType, data}) => {
            assert.equal(dialogType, DIALOG_USE_CARD);

            return {selected: data.cards[0]};
        };

        const reusePartsConfig = rocket.config.cards.find(({card}) =>
            card.params.name === 'Reutilizar piezas').card;
        assert.equal(reusePartsConfig.type, CARD_TYPE_RESOURCE);
        assert.equal(
            Object.hasOwn(reusePartsConfig.params.abilities[0].params, 'workInHand'),
            false,
        );
        const reuseParts = matchFactory.cardsFactory.createGameCardFromConfig(
            reusePartsConfig,
            {owner: player},
        );
        const ability = reuseParts.abilities[0];
        assert.equal(ability.trigger, TRIGGER_THIS_SPEND);
        player.hand.addCard(reuseParts);
        await new Promise(resolve => setImmediate(resolve));
        assert.ok(reuseParts.hasAbilityTrigger(ability));

        const technologyUpgrade =
            matchFactory.cardsFactory.createGameCardFromConfig({
                type: CARD_TYPE_UPGRADE,
                params: {
                    name: 'Mejora Tecnología de prueba',
                    cost: 1,
                    traits: [TRAIT_TECH],
                    resources: [],
                },
            }, {owner: player});
        const deckFiller = matchFactory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_UPGRADE,
            params: {name: 'Carta del mazo', cost: 0, resources: []},
        }, {owner: player});
        player.deck.cards.push(deckFiller);
        player.deck.discardPile.push(technologyUpgrade);

        const paymentResult = await new CostPaymentSession().resolve(
            new PayCostEffect({
                hand: [reuseParts],
                generators: [],
                match,
            }),
            {isCost: true, match, player},
            {requireAllCosts: true}
        );

        assert.equal(paymentResult.resolved, true);
        assert.strictEqual(player.deck.cards[0], technologyUpgrade);
        assert.ok(player.deck.discardPile.includes(reuseParts));
        assert.equal(reuseParts.hasAbilityTrigger(ability), false);
        assert.equal(match.triggerCards[reuseParts.id], undefined);

        const discardedResource = matchFactory.cardsFactory.createGameCardFromConfig(
            reusePartsConfig,
            {owner: player},
        );
        const discardedAbility = discardedResource.abilities[0];
        player.hand.addCard(discardedResource);
        await new Promise(resolve => setImmediate(resolve));
        assert.ok(discardedResource.hasAbilityTrigger(discardedAbility));

        player.hand.discardHand(discardedResource);
        assert.equal(discardedResource.hasAbilityTrigger(discardedAbility), false);
        assert.equal(match.triggerCards[discardedResource.id], undefined);
    });

    test('Crisis en Medio Mundo selects only the highest-cost upgrade and surges if none is discarded', async() => {
        const {rocket} = await getRocketRacoon();
        const match = new Match({
            mc: {mcSocket: {send() {}}},
            name: 'Mapache Cohete obligation',
        });
        const matchFactory = new MatchFactory(match);
        const superhero = matchFactory.createSuperhero({
            ...rocket.config,
            cards: [],
            obligation: undefined,
            precon: [],
            nemesis: [],
        });
        superhero.selectedSide = 1;
        superhero.refresh = async() => {};
        const player = match.createPlayer({
            name: 'Mapache Cohete',
            superhero,
            initial: true,
        });
        player.initPlayer();
        await superhero.initTriggers({match, player});

        const obligationCard = matchFactory.cardsFactory.createGameCardFromConfig(
            rocket.config.obligation.card,
            {owner: player},
        );
        const discardUpgrade = obligationCard.abilities[1].effect.options[1]
            .effect.effects[0];
        const doIfNoDiscard = obligationCard.abilities[1].effect.options[1]
            .effect.effects[1];
        assert.deepEqual(
            await discardUpgrade.getValidTarget({match, player}),
            [],
        );
        assert.equal(
            doIfNoDiscard.checkCondition({
                match,
                player,
                effects: [{cards: []}],
            }),
            true,
        );

        const upgrades = rocket.config.cards
            .filter(({card}) => card.type === CARD_TYPE_UPGRADE)
            .map(({card}) => matchFactory.cardsFactory.createGameCardFromConfig(
                card,
                {owner: player},
            ));
        upgrades.forEach(upgrade => player.addToGameZone(upgrade));

        const highestCostUpgrades = await discardUpgrade.getValidTarget({
            match,
            player,
        });
        assert.deepEqual(
            highestCostUpgrades.map(({name}) => name).sort(),
            ['Cañón de partículas', 'Lanzacohetes'],
        );
        assert.equal(
            doIfNoDiscard.checkCondition({
                match,
                player,
                effects: [{cards: highestCostUpgrades}],
            }),
            false,
        );
    });

    test('¡Estás muerto! responds to non-attack and Overkill excess damage', async() => {
        const {rocket} = await getRocketRacoon();
        const match = new Match({
            mc: {mcSocket: {send() {}}},
            name: 'Mapache Cohete excess damage',
        });
        const matchFactory = new MatchFactory(match);
        const superhero = matchFactory.createSuperhero({
            ...rocket.config,
            cards: [],
            obligation: undefined,
            precon: [],
            nemesis: [],
        });
        superhero.selectedSide = 1;
        const player = match.createPlayer({
            name: 'Mapache Cohete',
            superhero,
            initial: true,
        });
        player.initPlayer();
        await superhero.initTriggers({match, player});

        const responseAbility = superhero.sides[1].abilities.find(({name}) =>
            name === '¡Estás muerto!');
        assert.ok(responseAbility);
        const responseDialogs = [];
        match.openDialog = async dialog => {
            responseDialogs.push(dialog);

            return {
                selected: dialog.data?.cards?.find(({abilityNames = []}) =>
                    abilityNames.includes('¡Estás muerto!')),
            };
        };

        const launcherConfig = rocket.config.cards.find(({card}) =>
            card.params.name === 'Lanzacohetes').card;
        const launcher = matchFactory.cardsFactory.createGameCardFromConfig(
            launcherConfig,
            {owner: player},
        );
        launcher.controller = player;
        launcher.counters = 2;
        player.addToGameZone(launcher);
        const launcherAbility = launcher.abilities[1];
        const initialHandSize = player.hand.cards.length;
        const drawCards = Array.from({length: 6}, () =>
            matchFactory.cardsFactory.createGameCardFromConfig({
                type: CARD_TYPE_RESOURCE,
                params: {name: 'Carta para robar', resources: []},
            }, {owner: player}));
        player.deck.cards.push(...drawCards);

        const originalCreateEffect = match.effectsFactory.createEffect
            .bind(match.effectsFactory);
        match.effectsFactory.createEffect = params =>
            params.type === EFFECT_PLACE_DAMAGE ?
                {
                    async runEffect() {
                        const targets = Array.isArray(params.selectedTarget) ?
                            params.selectedTarget :
                            [params.selectedTarget];
                        const damage = Array.isArray(params.damage) ?
                            params.damage :
                            targets.map(() => params.damage);
                        targets.forEach((target, index) => {
                            target.damage += damage[index] ?? 0;
                        });
                    },
                } :
                originalCreateEffect(params);

        const createEnemy = (name, isMinion, life) => ({
            damage: 0,
            isInPlay: true,
            isMinion,
            isVillain: !isMinion,
            name,
            async getLife() {
                return life - this.damage;
            },
            async refresh() {},
            async defeat() {
                this.isInPlay = false;
                const index = player.minions.indexOf(this);
                if (index >= 0) {
                    player.minions.splice(index, 1);
                }
            },
            toObj() {
                return {damage: this.damage, name};
            },
            toObjWithAbilityAvailability() {
                return this.toObj();
            },
        });
        const minion = createEnemy('Dron', true, 1);
        minion.engaged = player;
        player.minions.push(minion);
        match.scenario ??= {};
        match.scenario.announceVillainDefeat = async() => {};
        match.scenario.villain = createEnemy('Villano', false, 10);
        await launcherAbility.resolveAbility({
            match,
            player,
            preselectedTarget: true,
            selectedTarget: player,
        });

        assert.equal(player.hand.cards.length, initialHandSize + 1);
        assert.ok(responseDialogs.some(({dialogType, data}) =>
            dialogType === DIALOG_USE_CARD &&
            data.cards.some(({abilityNames = []}) =>
                abilityNames.includes('¡Estás muerto!'))));

        const preventedMinion = createEnemy('Esbirro protegido', true, 1);
        player.minions.push(preventedMinion);
        const preventedDamage = new DealDamageEffect({
            ability: launcherAbility,
            damage: 5,
            preventDamage: 4,
            match,
            selectedTarget: preventedMinion,
        });
        await preventedDamage.runEffect({match, player});
        assert.equal(player.hand.cards.length, initialHandSize + 1);

        const blockedMinion = createEnemy('Esbirro protegido', true, 1);
        const excessMinion = createEnemy('Esbirro con daño sobrante', true, 1);
        player.minions.push(blockedMinion, excessMinion);
        const multiTargetPrevention = new TakeDamageEffect({
            ability: launcherAbility,
            damage: [2, 2],
            match,
            preventDamage: [2, 0],
            selectedTarget: [blockedMinion, excessMinion],
        });
        await multiTargetPrevention.runEffect({match, player});
        assert.equal(player.hand.cards.length, initialHandSize + 2);

        const multiTargetEnemies = [
            createEnemy('Esbirro múltiple', true, 1),
            createEnemy('Villano múltiple', false, 1),
        ];
        player.minions.push(multiTargetEnemies[0]);
        match.scenario.villain = multiTargetEnemies[1];
        const multiTargetDamage = new DealDamageEffect({
            ability: launcherAbility,
            damage: [4, 3],
            match,
            selectedTarget: multiTargetEnemies,
        });
        await multiTargetDamage.runEffect({match, player});
        assert.equal(player.hand.cards.length, initialHandSize + 4);

        const overkillTargets = [
            createEnemy('Esbirro', true, 2),
            createEnemy('Villano', false, 1),
        ];
        player.minions.push(overkillTargets[0]);
        overkillTargets[0].engaged = player;
        match.scenario.villain = overkillTargets[1];
        const overkillDamage = new DealDamageEffect({
            ability: launcherAbility,
            damage: 4,
            isAttack: true,
            keywords: {overkill: true},
            match,
            selectedTarget: overkillTargets[0],
        });
        await overkillDamage.runEffect({match, player});

        assert.equal(player.hand.cards.length, initialHandSize + 6);

        const pistolConfig = rocket.config.cards.find(({card}) =>
            card.params.name === 'Pistola de Cohete').card;
        const pistol = matchFactory.cardsFactory.createGameCardFromConfig(
            pistolConfig,
            {owner: player},
        );
        pistol.controller = player;
        pistol.counters = 3;
        player.addToGameZone(pistol);
        const pistolMinion = createEnemy('Esbirro de la Pistola', true, 1);
        player.minions.push(pistolMinion);
        player.deck.cards.push(matchFactory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_RESOURCE,
            params: {name: 'Carta tras la Pistola', resources: []},
        }, {owner: player}));
        const handBeforePistolAttack = player.hand.cards.length;
        const responseDialogsBeforePistolAttack = responseDialogs.length;

        await pistol.abilities[1].resolveAbility({
            match,
            player,
            preselectedTarget: true,
            selectedTarget: pistolMinion,
        });

        assert.equal(pistol.abilities[1].effect.isAttack, true);
        assert.equal(pistol.abilities[1].effect.excessDamage, 1);
        assert.equal(pistolMinion.isInPlay, false);
        assert.ok(responseDialogs.slice(responseDialogsBeforePistolAttack).some(
            ({dialogType, data}) =>
                dialogType === DIALOG_USE_CARD &&
                data.cards.some(({abilityNames = []}) =>
                    abilityNames.includes('¡Estás muerto!')),
        ));
        assert.equal(player.hand.cards.length, handBeforePistolAttack + 1);
    });

    test('Mala baba triggers on Brutality damage and Rocket draws for the excess', async() => {
        const {rocket, aspects} = await getRocketRacoon();
        const dialogs = [];
        const match = new Match({
            mc: {mcSocket: {send() {}}},
            name: 'Mapache Cohete Mala baba Brutality',
        });
        const matchFactory = new MatchFactory(match);
        const superhero = matchFactory.createSuperhero({
            ...rocket.config,
            cards: [],
            obligation: undefined,
            precon: [],
            nemesis: [],
        });
        superhero.selectedSide = 1;
        const player = match.createPlayer({
            name: 'Mapache Cohete',
            superhero,
            initial: true,
        });
        player.initPlayer();
        await superhero.initTriggers({match, player});
        player.deck.cards.push(...Array.from({length: 3}, (_, index) =>
            matchFactory.cardsFactory.createGameCardFromConfig({
                type: CARD_TYPE_RESOURCE,
                params: {name: `Carta de robo ${index}`, resources: []},
            }, {owner: player})));
        const malaBabaConfig = rocket.config.cards.find(({card}) =>
            card.params.name === 'Mala baba').card;
        const malaBaba = matchFactory.cardsFactory.createGameCardFromConfig(
            malaBabaConfig,
            {owner: player},
        );
        player.hand.addCard(malaBaba);
        await new PlayCardEffect({
            ability: malaBaba.abilities[0],
            card: malaBaba,
            match,
        }).doPlay({match, player});
        assert.equal(malaBaba.abilities[0].resolved, true);
        assert.ok(Object.keys(malaBaba.triggers).length > 0);
        assert.ok(match.triggerCards[malaBaba.id]);
        const malaDamageTrigger = Object.values(malaBaba.triggers)
            .flatMap(priorities => Object.values(priorities).flat())
            .find(trigger => trigger.trigger === TRIGGER_YOU_DEAL_DAMAGE);
        assert.ok(malaDamageTrigger);

        const asaltoEntry = aspects.find(({_id}) =>
            _id === 'aggression-asalto-implacable');
        const asalto = matchFactory.cardsFactory.createGameCardFromConfig(
            asaltoEntry.card,
            {owner: player},
        );
        const paymentResources = Array.from({length: 2}, (_, index) =>
            matchFactory.cardsFactory.createGameCardFromConfig({
                type: CARD_TYPE_RESOURCE,
                params: {
                    name: `Recurso físico ${index + 1}`,
                    resources: [RESOURCE_PHYSICAL],
                },
            }, {owner: player}));
        paymentResources.forEach(resource => player.hand.addCard(resource));
        player.hand.addCard(asalto);
        const asaltoPlayEffect = new PlayCardEffect({
            ability: asalto.abilities[0],
            card: asalto,
            match,
        });

        const createEnemy = (name, isMinion, life) => ({
            id: name,
            damage: 0,
            isInPlay: true,
            isMinion,
            isVillain: !isMinion,
            name,
            async getLife() {
                return life - this.damage;
            },
            placeDamage(damage) {
                this.damage += damage;
            },
            async refresh() {},
            async defeat() {
                this.isInPlay = false;
                const index = player.minions.indexOf(this);
                if (index >= 0) {
                    player.minions.splice(index, 1);
                }
            },
            toObj() {
                return {damage: this.damage, name};
            },
            toObjWithAbilityAvailability() {
                return this.toObj();
            },
        });
        const minion = createEnemy('Esbirro', true, 2);
        minion.engaged = player;
        player.minions.push(minion);
        const villain = createEnemy('Villano', false, 20);
        match.scenario = {
            announceVillainDefeat: async() => {},
            villain,
        };
        match.openDialog = async dialog => {
            dialogs.push(dialog);
            if (dialog.dialogType === DIALOG_PAY_COST) {
                return {
                    paid: {
                        generators: [],
                        hand: paymentResources.map(({id}) => ({id})),
                    },
                    resources: paymentResources.map(() => RESOURCE_PHYSICAL),
                    resourceUnits: paymentResources.map(({id}) => ({
                        cardId: id,
                        originalResource: RESOURCE_PHYSICAL,
                        resource: RESOURCE_PHYSICAL,
                        resourceIndex: 0,
                        source: 'hand',
                    })),
                };
            }

            if (dialog.dialogType === DIALOG_SELECT_TARGET) {
                return {
                    selected: dialog.data?.cards?.find(({id}) =>
                        id === minion.id),
                };
            }
            if (dialog.dialogType === DIALOG_DISCARD_ORDER) {
                return {
                    selected: paymentResources.map(({id}) => ({id})),
                };
            }
            if (dialog.dialogType === DIALOG_USE_CARD) {
                return {
                    selected: dialog.data?.cards?.find(({
                        abilityNames = [],
                        id,
                    }) =>
                        id === malaBaba.id ||
                        abilityNames.includes('¡Estás muerto!')),
                };
            }

            throw new Error(`Unexpected dialog: ${dialog.dialogType}`);
        };

        superhero.currentSide.damage = 8;
        await asaltoPlayEffect.runEffect({
            match,
            player,
            preselectedTarget: true,
            selectedTarget: minion,
        });

        assert.equal(minion.damage, 5);
        assert.equal(villain.damage, 3);
        assert.equal(player.deck.cards.length, 2);
        assert.ok(dialogs.some(({dialogType, data}) =>
            dialogType === DIALOG_USE_CARD &&
            data.cards.some(({abilityNames = []}) =>
                abilityNames.includes('¡Estás muerto!'))));
        assert.equal(dialogs.filter(({dialogType, data}) =>
            dialogType === DIALOG_USE_CARD &&
            data.cards.some(({id}) => id === malaBaba.id)).length, 2);
        assert.equal(superhero.currentSide.damage, 4);

        const launcherConfig = rocket.config.cards.find(({card}) =>
            card.params.name === 'Lanzacohetes').card;
        const launcher = matchFactory.cardsFactory.createGameCardFromConfig(
            launcherConfig,
            {owner: player},
        );
        launcher.controller = player;
        launcher.counters = 1;
        player.addToGameZone(launcher);
        const launcherMinions = [
            createEnemy('Esbirro enfrentado 1', true, 10),
            createEnemy('Esbirro enfrentado 2', true, 10),
        ];
        launcherMinions.forEach(minion => {
            minion.engaged = player;
            player.minions.push(minion);
        });
        const responseCountBeforeLauncher = dialogs.filter(
            ({dialogType, data}) =>
                dialogType === DIALOG_USE_CARD &&
                data.cards.some(({id}) => id === malaBaba.id)
        ).length;
        const targetSelectionCountBeforeLauncher = dialogs.filter(
            ({dialogType}) => dialogType === DIALOG_SELECT_TARGET
        ).length;
        superhero.currentSide.damage = 10;

        await player.resolveAbility(launcher.id, 1);

        assert.deepEqual(launcherMinions.map(({damage}) => damage), [2, 2]);
        assert.equal(dialogs.filter(({dialogType}) =>
            dialogType === DIALOG_SELECT_TARGET).length,
        targetSelectionCountBeforeLauncher);
        assert.equal(villain.damage, 5);
        assert.equal(dialogs.filter(({dialogType, data}) =>
            dialogType === DIALOG_USE_CARD &&
            data.cards.some(({id}) => id === malaBaba.id)).length,
        responseCountBeforeLauncher + 3);
        assert.equal(superhero.currentSide.damage, 4);
    });

    test('Lanzacohetes damages every minion engaged with the selected player', async() => {
        const {rocket} = await getRocketRacoon();
        const dialogs = [];
        const mcSocket = {
            isMatchAvailable: () => true,
            send(matchName, event, dialog) {
                if (event !== EVENTS.DIALOG.OPEN) {
                    return;
                }

                dialogs.push(dialog);
                const selected = dialog.dialogType === DIALOG_USE_CARD ?
                    dialog.data?.cards?.find(({abilityNames = []}) =>
                        abilityNames.includes('¡Estás muerto!')) :
                    dialog.dialogType === DIALOG_SELECT_TARGET ?
                        dialog.data?.cards?.find(({id}) =>
                            id === otherPlayer.id) :
                        undefined;
                const responseUserId = dialog.targetUserId || 'rocket-user';
                setImmediate(() => dialogSocket.respond(
                    matchName,
                    {
                        requestId: dialog.requestId,
                        response: selected ? {selected} : {},
                    },
                    responseUserId,
                ));
            },
        };
        const match = new Match({
            mc: {mcSocket},
            name: 'Mapache Cohete real excess damage',
        });
        match.persist = async() => {};
        match.refresh = async() => {};
        const dialogSocket = new DialogSocket(mcSocket);
        match.mc.dialog = dialogSocket;
        const matchFactory = new MatchFactory(match);
        const superhero = matchFactory.createSuperhero({
            ...rocket.config,
            cards: [],
            obligation: undefined,
            precon: [],
            nemesis: [],
        });
        const player = match.createPlayer({
            name: 'Mapache Cohete',
            userId: 'rocket-user',
            superhero,
            initial: true,
        });
        player.initPlayer();
        await superhero.initTriggers({match, player});
        const otherSuperhero = matchFactory.createSuperhero({
            ...rocket.config,
            cards: [],
            obligation: undefined,
            precon: [],
            nemesis: [],
        });
        const otherPlayer = match.createPlayer({
            name: 'Otro jugador',
            userId: 'other-user',
            superhero: otherSuperhero,
        });
        otherPlayer.initPlayer();
        await otherSuperhero.initTriggers({match, player: otherPlayer});

        const scenario = await matchFactory.createScenario({
            ...structuredClone(rhino.config),
            cards: [],
            sets: [],
            defaultSets: [],
        });
        match.addScenario(scenario);
        await scenario.initScenario([], false);
        const ultron = (await loadCatalog()).scenarios.find(({_id}) =>
            _id === 'ultron');
        assert.ok(ultron, 'Ultron should be present in the scenario catalog');
        const environmentConfig = ultron.config.cards.find(({card}) =>
            card.params.name === 'Drones de Ultrón').card;
        const environment = matchFactory.cardsFactory.createGameCardFromConfig(
            environmentConfig,
            {owner: scenario},
        );
        environment.controller = scenario;
        scenario.gameZone.addToGameZone(environment);
        await environment.initTriggers();
        await new FlipEffect({
            match,
            selectedFormTarget: superhero.sides[1],
            selectedTarget: superhero,
        }).execute({match, own: true, player});

        player.deck.cards = Array.from({length: 3}, (_, index) =>
            matchFactory.cardsFactory.createGameCardFromConfig({
                type: CARD_TYPE_RESOURCE,
                params: {name: `Carta de robo ${index}`, resources: []},
            }, {owner: player}));
        const facedownSourceCard = matchFactory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_RESOURCE,
            params: {name: 'Carta boca abajo', resources: []},
        }, {owner: otherPlayer});
        otherPlayer.deck.cards = [facedownSourceCard];
        await new PutFacedownCardInPlayEffect({
            match,
            selectedTarget: otherPlayer,
        }).runEffect({match, player: otherPlayer});
        const drone = otherPlayer.minions[0];
        assert.ok(drone.isFacedownCard);
        assert.ok(drone.isMinion);
        assert.equal(drone.hitPoints, 1);
        const secondMinion = {
            id: 'second-engaged-minion',
            damage: 0,
            engaged: otherPlayer,
            isInPlay: true,
            isMinion: true,
            name: 'Otro esbirro enfrentado',
            async getLife() {
                return 10 - this.damage;
            },
            placeDamage(damage) {
                this.damage += damage;
            },
            async refresh() {},
            toObj() {
                return {id: this.id, name: this.name};
            },
            toObjWithAbilityAvailability() {
                return this.toObj();
            },
        };
        otherPlayer.minions.push(secondMinion);

        const launcherConfig = rocket.config.cards.find(({card}) =>
            card.params.name === 'Lanzacohetes').card;
        const launcher = matchFactory.cardsFactory.createGameCardFromConfig(
            launcherConfig,
            {owner: player},
        );
        await new PutPlayEffect({
            card: launcher,
            match,
            selectedTarget: player,
        }).runEffect({match, player        });

        const initialHandSize = player.hand.cards.length;
        await player.resolveAbility(launcher.id, 1);

        assert.ok(!otherPlayer.minions.includes(drone));
        assert.equal(Boolean(drone.isMinion), false);
        assert.ok(otherPlayer.deck.cards.includes(drone) ||
            otherPlayer.deck.discardPile.includes(drone));
        assert.equal(secondMinion.damage, 2);
        const targetSelectionDialogs = dialogs.filter(({dialogType}) =>
            dialogType === DIALOG_SELECT_TARGET);
        assert.equal(targetSelectionDialogs.length, 1);
        assert.ok(targetSelectionDialogs[0].data.cards.some(({id}) =>
            id === otherPlayer.id));
        assert.ok(targetSelectionDialogs.every(({data}) =>
            data.cards.every(({id}) =>
                id !== drone.id && id !== secondMinion.id)));
        assert.equal(player.hand.cards.length, initialHandSize + 1);
        assert.ok(dialogs.some(({dialogType, targetPlayer, targetUserId, data}) =>
            dialogType === DIALOG_USE_CARD &&
            targetPlayer === player.id &&
            targetUserId === player.userId &&
            data.cards.some(({abilityNames = []}) =>
                abilityNames.includes('¡Estás muerto!'))));
    });

    test('Invasión planetaria reveals the last minion even when the encounter deck cycles', async() => {
        const {rocket} = await getRocketRacoon();
        const match = new Match({
            name: 'Mapache Cohete Invasión planetaria',
            mc: {mcSocket: {send() {}}},
        });
        match.persist = async() => {};
        match.refresh = async() => {};
        match.openDialog = async() => ({});

        const matchFactory = new MatchFactory(match);
        const superhero = matchFactory.createSuperhero({
            ...rocket.config,
            cards: [],
            obligation: undefined,
            precon: [],
            nemesis: [],
        });
        const player = match.createPlayer({
            name: 'Mapache Cohete',
            superhero,
            initial: true,
        });
        player.initPlayer();
        superhero.selectedSide = 1;
        match.currentPlayer = player;

        const scenario = await matchFactory.createScenario({
            ...rhino.config,
            cards: [],
            sets: [],
            defaultSets: [],
        });
        match.addScenario(scenario);
        await scenario.initScenario([], false);

        const finalMinion = matchFactory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_MINION,
            params: {
                name: 'Último esbirro',
                hitPoints: 3,
                attack: 1,
                scheme: 1,
            },
        }, {owner: scenario});
        const discardedEncounterCard =
            matchFactory.cardsFactory.createGameCardFromConfig({
                type: CARD_TYPE_TREACHERY,
                params: {name: 'Perfidia descartada', boost: 0},
            }, {owner: scenario});
        scenario.deck.cards = [discardedEncounterCard, finalMinion];

        const invasionCard = matchFactory.cardsFactory.createGameCardFromConfig(
            rocket.config.nemesis.find(({card}) =>
                card.params.name === 'Invasión planetaria').card,
            {owner: scenario},
        );
        await new RevealEncounterEffect({
            match,
            selectedTarget: invasionCard,
        }).runEffect({player});

        assert.ok(player.minions.includes(finalMinion));
        assert.strictEqual(finalMinion.engaged, player);
        assert.equal(finalMinion.isTough, true);
        assert.ok(!scenario.deck.cards.includes(finalMinion));
        assert.ok(!scenario.deck.discardPile.includes(finalMinion));
        assert.ok(scenario.deck.cards.includes(discardedEncounterCard));
    });
});
