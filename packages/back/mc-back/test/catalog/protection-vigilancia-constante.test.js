import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    ABILITY_HERO_ACTION,
    CARD_TYPE_EVENT,
    CLASSIFICATION_PROTECTION,
    EFFECT_READY,
    EFFECT_REMOVE_THREAT,
    EFFECT_SIMULTANEOUS,
    RESOURCE_MENTAL,
    TARGET_MAIN_SCHEME,
    TARGET_YOUR_HERO,
    TRAIT_AERIAL,
    TRAIT_SKILL,
} from 'mc-shared';
import {MongoDataStore} from '../../../mc-data/index.js';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {HeroActionAbility} from '../../src/abilities/actions/hero-action-ability.js';
import {ReadyEffect} from '../../src/effects/ready-effect.js';
import {RemoveThreatEffect} from '../../src/effects/remove-threat-effect.js';
import {SimultaneousEffect} from '../../src/effects/simultaneous-effect.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';
import {PlayerCard} from '../../src/model/printed/player-card.js';

describe('Vigilancia constante', () => {
    test('is available in the deck editor and absent from every precon', async () => {
        const {aspects, heroes} = await loadCatalog();
        const entry = aspects.find(({_id}) =>
            _id === 'protection-vigilancia-constante');

        assert.ok(entry);
        assert.equal(entry.aspect, CLASSIFICATION_PROTECTION);
        assert.equal(entry.order, 17030);
        assert.equal(entry.card.type, CARD_TYPE_EVENT);
        assert.equal(entry.card.params.name, 'Vigilancia constante');
        assert.equal(
            entry.card.params.image,
            'aspect/protection/events/17030.png'
        );
        assert.deepEqual(entry.card.params.traits, [
            TRAIT_AERIAL,
            TRAIT_SKILL,
        ]);
        assert.equal(entry.card.params.cost, 2);
        assert.deepEqual(entry.card.params.resources, [RESOURCE_MENTAL]);
        assert.equal(
            entry.card.params.classification,
            CLASSIFICATION_PROTECTION
        );

        const preconIds = heroes.flatMap(({config}) =>
            (config.precon ?? []).flatMap(({cardRefs = []}) =>
                cardRefs.map(({id}) => id)
            )
        );
        assert.equal(preconIds.includes(entry._id), false);

        const hero = heroes.find(({_id}) => _id === 'spiderwoman');
        const store = new MongoDataStore();
        store.database = {
            collection(name) {
                return {
                    findOne: async () => name === 'heroes' ? hero : null,
                    find: () => ({
                        sort() {
                            return this;
                        },
                        toArray: async () => aspects,
                    }),
                };
            },
        };
        const deckEditorCatalog = await store.getDeckEditorCatalog('spiderwoman');

        assert.ok(deckEditorCatalog.cards.some(({id, name}) =>
            id === entry._id && name === 'Vigilancia constante'));
    });

    test('can only be played by a superhero with the Aerial trait', async () => {
        const {aspects, heroes} = await loadCatalog();
        const entry = aspects.find(({_id}) =>
            _id === 'protection-vigilancia-constante');
        const superheroConfig = heroes.find(({_id}) =>
            _id === 'ms-marvel').config;
        const superhero = new MatchFactory(
            new Match({name: 'vigilancia-constante-playability'})
        ).createSuperhero({
            ...superheroConfig,
            cards: [],
            precon: [],
            nemesis: [],
        });
        superhero.selectedSide = 1;

        const card = new PlayerCard(entry.card.params);
        const player = {superhero};

        assert.deepEqual(card.paramsToPlay, {
            'superhero.traits': TRAIT_AERIAL,
        });
        assert.equal(await card.canPlay({player}), false);

        superhero.extraTraits.push(TRAIT_AERIAL);
        assert.equal(await card.canPlay({player}), true);
    });

    test('readies your Hero and removes two threat from the main scheme', async () => {
        const {aspects, heroes, scenarios} = await loadCatalog();
        const entry = aspects.find(({_id}) =>
            _id === 'protection-vigilancia-constante');
        const antMan = heroes.find(({_id}) => _id === 'ant-man');
        const rhino = scenarios.find(({_id}) => _id === 'rhino');
        const match = new Match({
            mc: {mcSocket: {send() {}}},
            name: 'vigilancia-constante-resolution',
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

        const mainScheme = match.mainScheme;
        mainScheme.threat = 6;
        const hero = player.superhero.currentSide;
        hero.exhaust();

        const event = factory.cardsFactory.createGameCardFromConfig(
            entry.card,
            {owner: player}
        );
        const [ability] = event.abilities;
        const effect = ability.effect;
        const [readyEffect, removeThreatEffect] = effect.effects;

        assert.equal(entry.card.params.abilities[0].type, ABILITY_HERO_ACTION);
        assert.ok(ability instanceof HeroActionAbility);
        assert.equal(effect.effectType, EFFECT_SIMULTANEOUS);
        assert.ok(effect instanceof SimultaneousEffect);
        assert.equal(readyEffect.effectType, EFFECT_READY);
        assert.ok(readyEffect instanceof ReadyEffect);
        assert.equal(removeThreatEffect.effectType, EFFECT_REMOVE_THREAT);
        assert.ok(removeThreatEffect instanceof RemoveThreatEffect);
        assert.equal(readyEffect.target, TARGET_YOUR_HERO);
        assert.equal(removeThreatEffect.target, TARGET_MAIN_SCHEME);
        assert.equal(typeof effect.canRun, 'function');
        assert.equal(await effect.canRun({card: event, match, player}), true);

        await effect.runEffect({card: event, match, player});

        assert.equal(hero.exhausted, false);
        assert.equal(mainScheme.threat, 4);
        assert.deepEqual(readyEffect.readiedTargets, [hero]);
    });
});
