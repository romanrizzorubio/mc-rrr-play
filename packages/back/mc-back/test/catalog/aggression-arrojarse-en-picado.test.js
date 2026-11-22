import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    ABILITY_HERO_ACTION,
    CARD_TYPE_EVENT,
    CLASSIFICATION_AGGRESSION,
    EFFECT_CHAINED,
    EFFECT_DEAL_DAMAGE,
    LABEL_ATTACK,
    RESOURCE_PHYSICAL,
    TARGET_ALL_ENEMIES,
    TARGET_ENEMY,
    TRAIT_AERIAL,
    TRAIT_ATTACK,
} from 'mc-shared';
import {MongoDataStore} from '../../../mc-data/index.js';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {ChainedEffect} from '../../src/effects/chained-effect.js';
import {DealDamageEffect} from '../../src/effects/deal-damage-effect.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';
import {PlayerZone} from '../../src/model/match/player-zone.js';
import {PlayerCard} from '../../src/model/printed/player-card.js';

describe('Arrojarse en picado', () => {
    test('is available in the deck editor catalog and absent from every precon', async () => {
        const {aspects, heroes} = await loadCatalog();
        const entry = aspects.find(({_id}) =>
            _id === 'aggression-arrojarse-en-picado');

        assert.ok(entry);
        assert.equal(entry.aspect, CLASSIFICATION_AGGRESSION);
        assert.equal(entry.order, 17028);
        assert.equal(entry.card.type, CARD_TYPE_EVENT);
        assert.equal(entry.card.params.name, 'Arrojarse en picado');
        assert.equal(
            entry.card.params.image,
            'aspect/aggression/events/17028.png'
        );
        assert.deepEqual(entry.card.params.traits, [
            TRAIT_AERIAL,
            TRAIT_ATTACK,
        ]);
        assert.equal(entry.card.params.cost, 4);
        assert.deepEqual(
            entry.card.params.resources,
            [RESOURCE_PHYSICAL]
        );
        assert.equal(
            entry.card.params.classification,
            CLASSIFICATION_AGGRESSION
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
            id === entry._id && name === 'Arrojarse en picado'));
    });

    test('requires an Aerial superhero and configures a labeled Hero attack', async () => {
        const {aspects, heroes} = await loadCatalog();
        const entry = aspects.find(({_id}) =>
            _id === 'aggression-arrojarse-en-picado');
        const superheroConfig = heroes.find(({_id}) =>
            _id === 'ms-marvel').config;
        const superhero = new MatchFactory(
            new Match({name: 'arrojarse-en-picado-playability'})
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

        const ability = entry.card.params.abilities[0];
        assert.equal(ability.type, ABILITY_HERO_ACTION);
        assert.deepEqual(ability.params.labels, [LABEL_ATTACK]);
    });

    test('is playable when Mjolnir grants Thor the Aerial trait', async () => {
        const {aspects, heroes} = await loadCatalog();
        const entry = aspects.find(({_id}) =>
            _id === 'aggression-arrojarse-en-picado');
        const thor = heroes.find(({_id}) => _id === 'thor');
        const match = new Match({
            mc: {
                mcSocket: {
                    send() {},
                },
            },
            name: 'arrojarse-en-picado-mjolnir-playability',
        });
        const matchFactory = new MatchFactory(match);
        const superhero = matchFactory.createSuperhero(thor.config);
        superhero.selectedSide = 1;
        const player = match.createPlayer({
            name: 'Thor',
            superhero,
        });
        player.gameZone = new PlayerZone({owner: player});

        const mjolnirConfig = thor.config.cards.find(({card}) =>
            card.params.name === 'Mjolnir').card;
        const mjolnir = matchFactory.cardsFactory.createGameCardFromConfig(
            mjolnirConfig,
            {owner: player}
        );
        player.addToGameZone(mjolnir);
        await mjolnir.initTriggers();

        const effectiveTraits = await superhero.getEffectiveTraits({player});
        assert.ok(effectiveTraits.includes(TRAIT_AERIAL));
        assert.equal(superhero.traits.includes(TRAIT_AERIAL), false);

        const card = new PlayerCard(entry.card.params);
        assert.equal(await card.canPlay({player}), true);
    });

    test('targets one enemy for 7 damage, then excludes it from splash damage', async () => {
        const {aspects} = await loadCatalog();
        const entry = aspects.find(({_id}) =>
            _id === 'aggression-arrojarse-en-picado');
        const createEnemy = (id, {
            isVillain = false,
            isTough = false,
        } = {}) => ({
            abilities: [],
            async getLife() {
                return 20 - this.damage;
            },
            id,
            isEnemy: true,
            isInPlay: true,
            isMinion: !isVillain,
            isVillain,
            isTough,
            name: id,
            damage: 0,
            toObj() {
                return {id: this.id, name: this.name};
            },
            removeTough() {
                this.isTough = false;
            },
            placeDamage(damage) {
                this.damage += damage;
            },
            canBeAttacked: () => true,
            async refresh() {},
        });
        const firstEnemy = createEnemy('first-enemy', {isVillain: true});
        const secondEnemy = createEnemy('second-enemy', {isTough: true});
        const thirdEnemy = createEnemy('third-enemy');
        const player = {
            gameZone: {
                cards: [secondEnemy, thirdEnemy],
                inPlayCards: [secondEnemy, thirdEnemy],
            },
            id: 'player',
            initial: true,
            isPlayer: true,
            minions: [secondEnemy, thirdEnemy],
            superhero: {attached: []},
        };
        const match = new Match({
            mc: {
                mcSocket: {
                    send() {},
                },
            },
            name: 'arrojarse-en-picado-damage-resolution',
        });
        match.players.push(player);
        match.scenario = {
            gameZone: {inPlayCards: []},
            villain: firstEnemy,
        };
        match.openDialog = async ({data}) => ({
            selected: data.cards.find(({id}) => id === firstEnemy.id),
        });
        player.match = match;

        const matchFactory = new MatchFactory(match);
        const gameCard = matchFactory.cardsFactory.createGameCardFromConfig(
            entry.card,
            {owner: player}
        );
        const [ability] = gameCard.abilities;
        ability.prepareEffect({preselectedTarget: true});

        const effect = ability.effect;
        const [primaryDamage, remainingEnemyDamage] = effect.effects;
        assert.ok(effect instanceof ChainedEffect);
        assert.equal(effect.effectType, EFFECT_CHAINED);
        assert.equal(typeof effect.canRun, 'function');
        assert.equal(ability.isAttack, true);
        assert.ok(primaryDamage instanceof DealDamageEffect);
        assert.equal(primaryDamage.effectType, EFFECT_DEAL_DAMAGE);
        assert.equal(primaryDamage.baseDamage, 7);
        assert.equal(primaryDamage.target, TARGET_ENEMY);
        assert.ok(remainingEnemyDamage instanceof DealDamageEffect);
        assert.equal(remainingEnemyDamage.effectType, EFFECT_DEAL_DAMAGE);
        assert.equal(remainingEnemyDamage.baseDamage, 1);
        assert.equal(remainingEnemyDamage.target, TARGET_ALL_ENEMIES);
        assert.deepEqual(remainingEnemyDamage.condition, {
            exclude: 'effects.0.selectedTarget',
        });

        effect.selectedTarget = player;
        primaryDamage.selectedTarget = firstEnemy;
        const effectParams = effect.getEffectParams({match, player});
        assert.deepEqual(
            remainingEnemyDamage.getValidTarget(effectParams),
            [secondEnemy, thirdEnemy]
        );
        assert.equal(await effect.canRun({match, player}), true);

        primaryDamage.selectedTarget = undefined;
        assert.deepEqual(
            remainingEnemyDamage.getValidTarget(effectParams),
            [secondEnemy, thirdEnemy, firstEnemy]
        );

        player.minions = [];
        player.gameZone.inPlayCards = [];
        primaryDamage.selectedTarget = firstEnemy;
        assert.deepEqual(
            remainingEnemyDamage.getValidTarget(effectParams),
            []
        );
        assert.notEqual(await remainingEnemyDamage.canRun(effectParams), true);

        player.minions = [secondEnemy, thirdEnemy];
        player.gameZone.inPlayCards = [secondEnemy, thirdEnemy];
        primaryDamage.selectedTarget = firstEnemy;
        await effect.runEffect({match, player});

        assert.equal(firstEnemy.damage, 7);
        assert.equal(secondEnemy.isTough, false);
        assert.equal(secondEnemy.damage, 0);
        assert.equal(thirdEnemy.damage, 1);
    });
});
