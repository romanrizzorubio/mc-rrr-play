import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    ABILITY_BOOST,
    ABILITY_CONSTANT,
    ABILITY_WHEN_REVEALED,
    CARD_TYPE_ALLY,
    CARD_TYPE_MINION,
    CARD_TYPE_TREACHERY,
    DAMAGE_TYPE_INDIRECT,
    DIALOG_ASSIGN,
    DIALOG_USE_CARD,
    EFFECT_CONFUSE,
    EFFECT_DEAL_DAMAGE,
    EFFECT_DO_IF,
    EFFECT_ENGAGE,
    EFFECT_MODIFY_ATTACK,
    EFFECT_TAKE_DAMAGE,
    TARGET_ALL_CHARACTERS_YOU_CONTROL,
    TARGET_EFFECT,
    TARGET_YOU,
    TRAIT_CREATURE,
    TRAIT_ELITE,
    TRAIT_GHOST,
    TRAIT_ROBOT,
    TRIGGER_THIS_ATTACK,
} from 'mc-shared';

import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {EngageEffect} from '../../src/effects/engage-effect.js';
import {RevealEncounterEffect} from '../../src/effects/reveal-encounter-effect.js';
import {Deck} from '../../src/model/match/deck.js';
import {Match} from '../../src/model/match/match.js';
import {ScenarioZone} from '../../src/model/match/scenario-zone.js';
import {MatchFactory} from '../../src/factory/match-factory.js';

describe('Bestiario galáctico modular encounter set', () => {
    const getFixture = async () => {
        const catalog = await loadCatalog();
        const set = catalog.sets.find(({_id}) =>
            _id === 'menagerie-medley');
        const thor = catalog.heroes.find(({_id}) => _id === 'thor');
        assert.ok(set);
        assert.ok(thor);

        const match = new Match({
            mc: {
                mcSocket: {
                    send() {},
                },
            },
            name: 'menagerie-medley-test',
        });
        const matchFactory = new MatchFactory(match);
        const superhero = matchFactory.createSuperhero(thor.config);
        superhero.selectedSide = 1;
        const player = match.createPlayer({
            name: 'Thor',
            superhero,
            initial: true,
        });
        player.initPlayer();
        player.gameZone.refresh = async () => {};
        player.refresh = async () => {};
        superhero.refresh = async () => {};
        superhero.sides.forEach(side => {
            side.refresh = async () => {};
        });

        const scenario = {
            match,
            name: set.config.name,
        };
        scenario.deck = new Deck({
            owner: scenario,
            isScenarioDeck: true,
        });
        scenario.gameZone = new ScenarioZone({owner: scenario});
        scenario.gameZone.refresh = async () => {};
        match.scenario = scenario;

        match.openDialog = async ({dialogType, data}) => {
            if (dialogType === DIALOG_ASSIGN) {
                return {
                    assigned: Object.fromEntries(data.cards.map(card => [
                        card.id,
                        card.isSuperhero ? 1 : 2,
                    ])),
                };
            }
            if (dialogType === DIALOG_USE_CARD && data.cards?.length) {
                return {selected: data.cards[0]};
            }

            return {};
        };

        return {
            cardsFactory: matchFactory.cardsFactory,
            match,
            player,
            scenario,
            set,
        };
    };

    const getCardEntry = (set, name) =>
        set.config.cards.find(({card}) => card.params.name === name);

    const createMinion = (cardsFactory, scenario, set, name) =>
        cardsFactory.createGameCardFromConfig(
            getCardEntry(set, name).card,
            {owner: scenario}
        );

    test('registers the three cards with their supplied counts, traits, stats, and images', async () => {
        const {set} = await getFixture();
        const entries = set.config.cards;

        assert.equal(set._id, 'menagerie-medley');
        assert.equal(set.config.name, 'Bestiario galáctico');
        assert.equal(set.config.standard, false);
        entries.forEach(entry => {
            assert.deepEqual(Object.keys(entry).sort(), ['card', 'count']);
            assert.equal(entry.card.params.set, 'menagerie-medley');
            assert.equal(entry.card.type, CARD_TYPE_MINION);
            assert.equal(entry.card.params.boost, 0);
        });
        assert.deepEqual(
            entries.map(({count, card}) => [
                card.params.name,
                count,
                card.params.image,
            ]),
            [
                ['Fantasma psiónico', 4, 'sets/menagerie-medley/16135.png'],
                ['Siervo robótico', 3, 'sets/menagerie-medley/16136.png'],
                ['Tiburón espacial', 2, 'sets/menagerie-medley/16137.png'],
            ]
        );

        const ghost = getCardEntry(set, 'Fantasma psiónico').card;
        assert.deepEqual(ghost.params.traits, [TRAIT_GHOST]);
        assert.deepEqual(
            {
                attack: ghost.params.attack,
                scheme: ghost.params.scheme,
                hitPoints: ghost.params.hitPoints,
            },
            {attack: 2, scheme: 2, hitPoints: 4}
        );

        const servant = getCardEntry(set, 'Siervo robótico').card;
        assert.deepEqual(servant.params.traits, [TRAIT_ROBOT]);
        assert.deepEqual(
            {
                attack: servant.params.attack,
                scheme: servant.params.scheme,
                hitPoints: servant.params.hitPoints,
            },
            {attack: 1, scheme: 1, hitPoints: 3}
        );
        assert.deepEqual(servant.params.keywords, {
            guard: true,
            patrol: true,
        });

        const shark = getCardEntry(set, 'Tiburón espacial').card;
        assert.deepEqual(shark.params.traits, [TRAIT_CREATURE, TRAIT_ELITE]);
        assert.deepEqual(
            {
                attack: shark.params.attack,
                scheme: shark.params.scheme,
                hitPoints: shark.params.hitPoints,
            },
            {attack: 3, scheme: 1, hitPoints: 7}
        );
        assert.deepEqual(shark.params.keywords, {quickStrike: true});
    });

    test('compiles each printed and Boost ability into one runnable effect', async () => {
        const {cardsFactory, set} = await getFixture();

        set.config.cards.forEach(({card}) => {
            const gameCard = cardsFactory.createGameCardFromConfig(card);

            gameCard.abilities.forEach(ability => {
                assert.ok(ability.effect);
                assert.equal(typeof ability.effect.canRun, 'function');
            });
            if (gameCard.boostAbility) {
                assert.ok(gameCard.boostAbility.effect);
                assert.equal(typeof gameCard.boostAbility.effect.canRun, 'function');
            }
        });

        const ghost = getCardEntry(set, 'Fantasma psiónico').card;
        assert.equal(ghost.params.abilities[0].type, ABILITY_WHEN_REVEALED);
        assert.equal(ghost.params.abilities[0].params.effect.type, EFFECT_DO_IF);
        assert.equal(
            ghost.params.abilities[0].params.effect.params.effect.type,
            EFFECT_TAKE_DAMAGE
        );
        assert.equal(
            ghost.params.abilities[0].params.effect.params.effectNot.type,
            EFFECT_CONFUSE
        );
        assert.equal(ghost.params.boostAbility.type, ABILITY_BOOST);
        assert.equal(ghost.params.boostAbility.params.effect.type, EFFECT_ENGAGE);
        assert.deepEqual(
            ghost.params.boostAbility.params.effect.params,
            {cardSource: 'card', target: TARGET_YOU}
        );

        const shark = getCardEntry(set, 'Tiburón espacial').card;
        assert.equal(shark.params.abilities[0].type, ABILITY_CONSTANT);
        assert.equal(
            shark.params.abilities[0].params.trigger,
            TRIGGER_THIS_ATTACK
        );
        assert.equal(
            shark.params.abilities[0].params.effect.type,
            EFFECT_MODIFY_ATTACK
        );
        assert.equal(
            shark.params.abilities[0].params.effect.params.target,
            TARGET_EFFECT
        );
        assert.equal(
            shark.params.abilities[0].params.effect.params.modify.damageType,
            DAMAGE_TYPE_INDIRECT
        );
        assert.deepEqual(shark.params.keywords, {quickStrike: true});
        assert.equal(shark.params.boostAbility.type, ABILITY_BOOST);
        assert.equal(
            shark.params.boostAbility.params.effect.type,
            EFFECT_DEAL_DAMAGE
        );
        assert.deepEqual(shark.params.boostAbility.params.effect.params, {
            damage: 1,
            target: TARGET_ALL_CHARACTERS_YOU_CONTROL,
        });
    });

    test('Fantasma psiónico confuses the player when revealed if they were not confused', async () => {
        const {cardsFactory, match, player, scenario, set} = await getFixture();
        const ghost = createMinion(
            cardsFactory,
            scenario,
            set,
            'Fantasma psiónico'
        );

        await new RevealEncounterEffect({
            match,
            selectedTarget: ghost,
        }).runEffect({player});

        assert.equal(player.superhero.confused, 1);
        assert.equal(player.superhero.damage, 0);
        assert.equal(ghost.engaged, player);
    });

    test('Fantasma psiónico deals 1 damage instead if the player was already confused', async () => {
        const {cardsFactory, match, player, scenario, set} = await getFixture();
        const ghost = createMinion(
            cardsFactory,
            scenario,
            set,
            'Fantasma psiónico'
        );
        player.superhero.confused = 1;

        await new RevealEncounterEffect({
            match,
            selectedTarget: ghost,
        }).runEffect({player});

        assert.equal(player.superhero.confused, 1);
        assert.equal(player.superhero.damage, 1);
    });

    test('Fantasma psiónico Boost puts it into play engaged without resolving When Revealed', async () => {
        const {cardsFactory, match, player, scenario, set} = await getFixture();
        const ghost = createMinion(
            cardsFactory,
            scenario,
            set,
            'Fantasma psiónico'
        );

        await ghost.boostAbility.resolveAbility({
            card: ghost,
            match,
            player,
        });

        assert.equal(ghost.isInPlay, true);
        assert.equal(ghost.engaged, player);
        assert.equal(player.superhero.confused, 0);
    });

    test('Tiburón espacial Quickstrike attacks with indirect damage after engaging', async () => {
        const {cardsFactory, match, player, scenario, set} = await getFixture();
        const shark = createMinion(
            cardsFactory,
            scenario,
            set,
            'Tiburón espacial'
        );
        const ally = cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_ALLY,
            params: {
                name: 'Aliado de prueba',
                hitPoints: 5,
                attack: 1,
                thwart: 1,
                cost: 0,
            },
        }, {owner: player});
        player.addToGameZone(ally);
        scenario.deck.cards.push(cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_TREACHERY,
            params: {
                name: 'Aumento de prueba',
                set: 'menagerie-medley-test',
                boost: 0,
            },
        }, {owner: scenario}));

        await new EngageEffect({
            card: shark,
            match,
            target: TARGET_YOU,
        }).runEffect({player});

        assert.equal(shark.engaged, player);
        assert.equal(player.superhero.damage, 1);
        assert.equal(ally.damage, 2);
    });

    test('Tiburón espacial Boost deals 1 damage to every character the player controls', async () => {
        const {cardsFactory, match, player, scenario, set} = await getFixture();
        const shark = createMinion(
            cardsFactory,
            scenario,
            set,
            'Tiburón espacial'
        );
        const ally = cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_ALLY,
            params: {
                name: 'Aliado de prueba',
                hitPoints: 5,
                attack: 1,
                thwart: 1,
                cost: 0,
            },
        }, {owner: player});
        player.addToGameZone(ally);

        await shark.boostAbility.resolveAbility({
            card: shark,
            match,
            player,
        });

        assert.equal(player.superhero.damage, 1);
        assert.equal(ally.damage, 1);
    });
});
