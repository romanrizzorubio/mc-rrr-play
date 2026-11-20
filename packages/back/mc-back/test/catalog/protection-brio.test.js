import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    ABILITY_RESPONSE,
    CALC_THWART,
    CARD_TYPE_EVENT,
    CARD_TYPE_RESOURCE,
    CLASSIFICATION_PROTECTION,
    EFFECT_REMOVE_THREAT,
    LABEL_THWART,
    RESOURCE_ENERGY,
    TARGET_SCHEME,
    TRIGGER_HERO_DEFENDED_ATTACK,
} from 'mc-shared';
import {MongoDataStore} from '../../../mc-data/index.js';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {RemoveThreatEffect} from '../../src/effects/remove-threat-effect.js';
import {EnemyAttackEffect} from '../../src/effects/enemy-attack-effect.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {HeroDefendedAttackTrigger} from '../../src/triggers/hero-defended-attack-trigger.js';
import {Match} from '../../src/model/match/match.js';

describe('Brío', () => {
    const createContext = async () => {
        const {aspects, heroes, scenarios} = await loadCatalog();
        const definition = aspects.find(({_id}) =>
            _id === 'protection-brio');
        const antMan = heroes.find(({_id}) => _id === 'ant-man');
        const rhino = scenarios.find(({_id}) => _id === 'rhino');
        const match = new Match({
            mc: {mcSocket: {send() {}}},
            name: 'protection-brio',
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

        const event = factory.cardsFactory.createGameCardFromConfig(
            definition.card,
            {owner: player},
        );
        event.refresh = async () => {};
        player.hand.addCard(event);

        return {
            aspects,
            definition,
            event,
            factory,
            heroes,
            mainScheme,
            match,
            player,
        };
    };

    test('is in the Protection collection and absent from every precon', async () => {
        const {aspects, heroes} = await loadCatalog();
        const definition = aspects.find(({_id}) =>
            _id === 'protection-brio');

        assert.ok(definition);
        assert.equal(definition.aspect, CLASSIFICATION_PROTECTION);
        assert.equal(definition.order, 18031);
        assert.equal(definition.card.type, CARD_TYPE_EVENT);
        assert.equal(definition.card.params.name, 'Brío');
        assert.equal(
            definition.card.params.image,
            'aspect/protection/events/18031.png',
        );
        assert.equal(definition.card.params.cost, 1);
        assert.deepEqual(definition.card.params.resources, [RESOURCE_ENERGY]);
        assert.equal(
            definition.card.params.classification,
            CLASSIFICATION_PROTECTION,
        );

        const preconIds = heroes.flatMap(({config}) =>
            (config.precon ?? []).flatMap(({cardRefs = []}) =>
                cardRefs.map(({id}) => id),
            ),
        );
        assert.equal(preconIds.includes(definition._id), false);

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
            id === definition._id && name === 'Brío'));
    });

    test('responds after your Hero defends and removes threat equal to effective INT', async () => {
        const {definition, event, factory, mainScheme, match, player} =
            await createContext();
        const [ability] = event.abilities;
        const [abilityConfig] = definition.card.params.abilities;
        const hero = player.superhero.currentSide;
        const attack = new EnemyAttackEffect({
            activation: {getTriggersEnds: () => []},
            enemy: {isMinion: true},
            match,
            selectedTarget: player,
        });
        attack.defender = hero;
        const trigger = new HeroDefendedAttackTrigger({
            ability,
            card: event,
            trigger: TRIGGER_HERO_DEFENDED_ATTACK,
        });
        const triggerTypes = attack.getTriggersEnds({
            effect: attack,
            match,
            player,
        });

        assert.equal(abilityConfig.type, ABILITY_RESPONSE);
        assert.equal(abilityConfig.params.labels[0], LABEL_THWART);
        assert.equal(abilityConfig.params.trigger, TRIGGER_HERO_DEFENDED_ATTACK);
        assert.ok(triggerTypes.includes(TRIGGER_HERO_DEFENDED_ATTACK));
        player.canPlayCard = async () => true;
        player.hand.addCard(factory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_RESOURCE,
            params: {
                name: 'Test resource',
                resources: [RESOURCE_ENERGY],
            },
        }, {owner: player}));
        assert.equal(await trigger.canTrigger({
            defender: hero,
            effect: attack,
            player,
        }), true);

        const effect = ability.effect;
        assert.ok(effect instanceof RemoveThreatEffect);
        assert.equal(effect.effectType, EFFECT_REMOVE_THREAT);
        assert.equal(effect.target, TARGET_SCHEME);
        assert.equal(effect.paramsCalc.formula, CALC_THWART);

        const baseInt = await hero.getThwartValue({match, player});
        hero.modifyThwart += 1;
        const effectiveInt = await hero.getThwartValue({match, player});
        assert.equal(effectiveInt, baseInt + 1);
        const startingThreat = mainScheme.threat;
        assert.equal(await effect.canRun({card: event, match, player}), true);
        await effect.runEffect({card: event, match, player});

        assert.equal(effect.threat, effectiveInt);
        assert.equal(mainScheme.threat, startingThreat - effectiveInt);
    });
});
