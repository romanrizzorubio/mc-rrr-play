import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
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
    DIALOG_USE_CARD,
    EFFECT_CHOOSE_ABILITY,
    EFFECT_CHAINED,
    EFFECT_DISCARD_GAME,
    EFFECT_DO_IF,
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
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import rhino from '../../../mc-data/seed/catalog/scenarios/rhino.js';
import {PayCostEffect} from '../../src/effects/pay-cost-effect.js';
import {RevealEncounterEffect} from '../../src/effects/reveal-encounter-effect.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';

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

        await new PayCostEffect({
            hand: [reuseParts],
            generators: [],
            match,
        }).runEffect({match, player});

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
