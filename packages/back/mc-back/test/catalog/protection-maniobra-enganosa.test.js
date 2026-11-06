import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    ABILITY_HERO_ACTION,
    CARD_TYPE_EVENT,
    CARD_TYPE_TREACHERY,
    CHARACTER_VILLAIN,
    CLASSIFICATION_PROTECTION,
    EFFECT_CHAINED,
    EFFECT_ENEMY_ATTACK,
    EFFECT_REMOVE_THREAT,
    LABEL_THWART,
    RESOURCE_ENERGY,
    TARGET_MAIN_SCHEME,
    TARGET_YOU,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {HeroActionAbility} from '../../src/abilities/actions/hero-action-ability.js';
import {ChainedEffect} from '../../src/effects/chained-effect.js';
import {EnemyAttackEffect} from '../../src/effects/enemy-attack-effect.js';
import {RemoveThreatEffect} from '../../src/effects/remove-threat-effect.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';

describe('Maniobra engañosa', () => {
    const createContext = async () => {
        const {aspects, heroes, scenarios} = await loadCatalog();
        const definition = aspects.find(({_id}) =>
            _id === 'protection-maniobra-enganosa');
        const antMan = heroes.find(({_id}) => _id === 'ant-man');
        const rhino = scenarios.find(({_id}) => _id === 'rhino');
        const match = new Match({
            mc: {mcSocket: {send() {}}},
            name: 'protection-maniobra-enganosa',
        });
        match.persist = async () => {};
        match.refresh = async () => {};
        match.openDialog = async () => ({});

        const factory = new MatchFactory(match);
        const player = match.createPlayer({
            name: 'Ant-Man',
            superhero: factory.createSuperhero({
                ...antMan.config,
                cards: [],
                precon: [],
                nemesis: [],
                obligation: undefined,
            }),
            initial: true,
        });
        player.initPlayer();
        player.superhero.selectedSide = 1;
        match.currentPlayer = player;
        match.scenario = await factory.createScenario({
            ...rhino.config,
            sets: [],
            defaultSets: [],
            cards: [],
        });
        await match.scenario.initScenario([], false);
        match.phase = 'hero';
        match.playing = true;
        match.scenario.deck.cards = [
            factory.cardsFactory.createGameCardFromConfig({
                type: CARD_TYPE_TREACHERY,
                params: {name: 'Carta de aumento de prueba', boost: 0},
            }, {owner: match.scenario}),
        ];

        const mainScheme = match.mainScheme;
        mainScheme.threat = 6;

        const event = factory.cardsFactory.createGameCardFromConfig(
            definition.card,
            {owner: player},
        );
        event.refresh = async () => {};
        player.hand.addCard(event);

        return {definition, event, heroes, mainScheme, match, player};
    };

    test('defines a shared Protection Hero Action without adding it to a precon', async () => {
        const {definition, heroes} = await createContext();

        assert.ok(definition);
        assert.equal(definition.aspect, CLASSIFICATION_PROTECTION);
        assert.equal(definition.card.type, CARD_TYPE_EVENT);
        assert.equal(definition.card.params.name, 'Maniobra engañosa');
        assert.equal(
            definition.card.params.image,
            'aspect/protection/events/15030.png',
        );
        assert.equal(definition.card.params.cost, 1);
        assert.deepEqual(
            definition.card.params.resources,
            [RESOURCE_ENERGY],
        );

        const [ability] = definition.card.params.abilities;
        assert.equal(ability.type, ABILITY_HERO_ACTION);
        assert.deepEqual(ability.params, {
            name: 'Maniobra engañosa',
            labels: [LABEL_THWART],
            effect: {
                type: EFFECT_CHAINED,
                params: {
                    effects: [
                        {
                            type: EFFECT_ENEMY_ATTACK,
                            params: {
                                enemyType: CHARACTER_VILLAIN,
                                target: TARGET_YOU,
                            },
                        },
                        {
                            type: EFFECT_REMOVE_THREAT,
                            params: {
                                target: TARGET_MAIN_SCHEME,
                                threat: 4,
                            },
                        },
                    ],
                },
            },
        });

        assert.equal(
            heroes.some(({config}) =>
                config.precon?.some(({cardRefs}) =>
                    cardRefs.some(({id}) => id === definition._id),
                ),
            ),
            false,
        );
    });

    test('the Villain attacks you before four threat is removed from the main scheme', async () => {
        const {event, mainScheme, match, player} =
            await createContext();
        const [ability] = event.abilities;
        const [attackEffect, removeThreatEffect] = ability.effect.effects;

        assert.ok(ability instanceof HeroActionAbility);
        assert.ok(ability.effect instanceof ChainedEffect);
        assert.ok(attackEffect instanceof EnemyAttackEffect);
        assert.ok(removeThreatEffect instanceof RemoveThreatEffect);
        assert.equal(typeof ability.effect.canRun, 'function');
        assert.equal(await ability.effect.canRun({match, player}), true);

        const hero = player.superhero.currentSide;
        const startingDamage = hero.damage;
        await ability.effect.runEffect({match, player});

        assert.equal(attackEffect.resolved, true);
        assert.equal(removeThreatEffect.resolved, true);
        assert.equal(hero.damage, startingDamage + 2);
        assert.equal(mainScheme.threat, 2);
    });
});
