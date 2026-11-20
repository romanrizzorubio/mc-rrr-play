import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    ABILITY_HERO_ACTION,
    CARD_TYPE_EVENT,
    CLASSIFICATION_JUSTICE,
    EFFECT_CHAINED,
    EFFECT_CONFUSE,
    EFFECT_TAKE_DAMAGE,
    RESOURCE_ENERGY,
    TARGET_VILLAIN,
    TARGET_YOU,
    TRAIT_GUARDIAN,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import rhino from '../../../mc-data/seed/catalog/scenarios/rhino.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';

describe('¡Espabila!', () => {
    const createPlayer = (match, factory, heroes, heroId) => {
        const hero = heroes.find(({_id}) => _id === heroId);
        assert.ok(hero, `Missing hero: ${heroId}`);

        const player = match.createPlayer({
            name: heroId,
            initial: true,
            superhero: factory.createSuperhero({
                ...hero.config,
                cards: [],
                precon: [],
                obligation: undefined,
                nemesis: [],
            }),
        });
        player.initPlayer();
        player.superhero.selectedSide = 1;

        return player;
    };

    test('is a shared Justice event and is absent from every precon', async () => {
        const {aspects, heroes} = await loadCatalog();
        const definition = aspects.find(({_id}) =>
            _id === 'justice-espabila');

        assert.ok(definition);
        assert.equal(definition.aspect, CLASSIFICATION_JUSTICE);
        assert.equal(definition.card.type, CARD_TYPE_EVENT);
        assert.equal(definition.card.params.name, '¡Espabila!');
        assert.equal(definition.card.params.set, CLASSIFICATION_JUSTICE);
        assert.equal(
            definition.card.params.image,
            'aspect/justice/events/19031.png'
        );
        assert.equal(definition.card.params.cost, 1);
        assert.deepEqual(definition.card.params.resources, [RESOURCE_ENERGY]);
        assert.equal(
            definition.card.params.classification,
            CLASSIFICATION_JUSTICE
        );
        assert.deepEqual(definition.card.params.paramsToPlay, {
            'superhero.traits': TRAIT_GUARDIAN,
        });

        const [ability] = definition.card.params.abilities;
        assert.equal(ability.type, ABILITY_HERO_ACTION);
        assert.deepEqual(ability.params.effect, {
            type: EFFECT_CHAINED,
            params: {
                effects: [
                    {
                        type: EFFECT_TAKE_DAMAGE,
                        params: {target: TARGET_YOU, damage: 1},
                    },
                    {
                        type: EFFECT_CONFUSE,
                        params: {target: TARGET_VILLAIN},
                    },
                ],
            },
        });

        const preconIds = heroes.flatMap(({config}) =>
            (config.precon ?? []).flatMap(({cardRefs = []}) =>
                cardRefs.map(({id}) => id)
            )
        );
        const heroCardNames = heroes.flatMap(({config}) =>
            (config.cards ?? []).map(({card}) => card.params.name)
        );
        assert.equal(preconIds.includes(definition._id), false);
        assert.equal(heroCardNames.includes('¡Espabila!'), false);
    });

    test('requires the active superhero to have the effective Guardian trait', async () => {
        const {aspects, heroes} = await loadCatalog();
        const definition = aspects.find(({_id}) =>
            _id === 'justice-espabila');
        const match = new Match({
            mc: {mcSocket: {send() {}}},
            name: 'justice-espabila-play-restriction',
        });
        const factory = new MatchFactory(match);
        const guardian = createPlayer(match, factory, heroes, 'drax');
        const guardianCard = factory.cardsFactory.createGameCardFromConfig(
            definition.card,
            {owner: guardian}
        );

        assert.ok(guardian.superhero.traits.includes(TRAIT_GUARDIAN));
        assert.equal(
            await guardianCard.canPlay({
                abilityType: ABILITY_HERO_ACTION,
                player: guardian,
            }),
            true
        );

        const otherPlayer = createPlayer(match, factory, heroes, 'thor');
        const otherCard = factory.cardsFactory.createGameCardFromConfig(
            definition.card,
            {owner: otherPlayer}
        );

        assert.equal(otherPlayer.superhero.traits.includes(TRAIT_GUARDIAN), false);
        assert.equal(
            await otherCard.canPlay({
                abilityType: ABILITY_HERO_ACTION,
                player: otherPlayer,
            }),
            false
        );

        otherPlayer.superhero.getEffectiveTraits = async () => [
            TRAIT_GUARDIAN,
        ];
        assert.equal(
            await otherCard.canPlay({
                abilityType: ABILITY_HERO_ACTION,
                player: otherPlayer,
            }),
            true
        );
    });

    test('suffers 1 damage before confusing the Villain', async () => {
        const {aspects, heroes} = await loadCatalog();
        const definition = aspects.find(({_id}) =>
            _id === 'justice-espabila');
        const match = new Match({
            mc: {mcSocket: {send() {}}},
            name: 'justice-espabila-effect',
        });
        match.persist = async () => {};
        match.refresh = async () => {};
        match.openDialog = async () => ({});
        const factory = new MatchFactory(match);
        const player = createPlayer(match, factory, heroes, 'drax');
        match.currentPlayer = player;
        match.currentTurnPlayer = player;
        match.scenario = await factory.createScenario({
            ...rhino.config,
            sets: [],
            defaultSets: [],
            cards: [],
        });
        await match.scenario.initScenario([], false);
        const villain = match.villain;
        const event = factory.cardsFactory.createGameCardFromConfig(
            definition.card,
            {owner: player}
        );
        const [ability] = event.abilities;
        const initialDamage = player.superhero.damage;

        await ability.resolveAbility({card: event, player});

        assert.equal(player.superhero.damage, initialDamage + 1);
        assert.equal(villain.isConfused, true);
    });
});
