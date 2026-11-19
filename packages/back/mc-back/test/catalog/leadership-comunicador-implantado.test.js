import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    ABILITY_CONSTANT,
    CARD_TYPE_ALLY,
    CARD_TYPE_UPGRADE,
    CLASSIFICATION_LEADERSHIP,
    EFFECT_MODIFY_HIT_POINTS,
    EFFECT_MODIFY_THWART_VALUE,
    RESOURCE_MENTAL,
    TARGET_ALLY,
    TARGET_ATTACHED,
    TARGET_EFFECT,
    TRAIT_GUARDIAN,
    TRAIT_ITEM,
    TRAIT_TECH,
    TRIGGER_ATTACHED_GET_THWART,
    TRIGGER_CHARACTER_GET_HIT_POINTS,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {ModifyHitPointsEffect} from '../../src/effects/modify-hit-points-effect.js';
import {ModifyThwartValueEffect} from '../../src/effects/modify-thwart-value-effect.js';
import {PlayCardEffect} from '../../src/effects/play-card-effect.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';
import {PlayerZone} from '../../src/model/match/player-zone.js';

describe('Comunicador implantado', () => {
    test('is in the shared Leadership collection and absent from every precon', async () => {
        const catalog = await loadCatalog();
        const definition = catalog.aspects.find(({_id}) =>
            _id === 'leadership-comunicador-implantado');

        assert.ok(definition);
        assert.equal(definition.aspect, CLASSIFICATION_LEADERSHIP);
        assert.equal(definition.order, 18030);
        assert.deepEqual(definition.card, {
            type: CARD_TYPE_UPGRADE,
            params: {
                name: 'Comunicador implantado',
                set: CLASSIFICATION_LEADERSHIP,
                image: 'aspect/leadership/upgrades/18030.png',
                traits: [TRAIT_ITEM, TRAIT_TECH],
                cost: 1,
                resources: [RESOURCE_MENTAL],
                classification: CLASSIFICATION_LEADERSHIP,
                attach: {
                    target: TARGET_ALLY,
                    condition: {traits: TRAIT_GUARDIAN},
                },
                maxAttach: 1,
                abilities: [
                    {
                        type: ABILITY_CONSTANT,
                        params: {
                            trigger: TRIGGER_ATTACHED_GET_THWART,
                            effect: {
                                type: EFFECT_MODIFY_THWART_VALUE,
                                params: {target: TARGET_EFFECT, count: 1},
                            },
                        },
                    },
                    {
                        type: ABILITY_CONSTANT,
                        params: {
                            trigger: TRIGGER_CHARACTER_GET_HIT_POINTS,
                            effect: {
                                type: EFFECT_MODIFY_HIT_POINTS,
                                params: {target: TARGET_ATTACHED, count: 1},
                            },
                        },
                    },
                ],
            },
        });

        const preconIds = catalog.heroes.flatMap(({config}) =>
            config.precon.flatMap(({cardRefs = []}) =>
                cardRefs.map(({id}) => id)
            )
        );
        assert.equal(preconIds.includes(definition._id), false);
    });

    test('attaches only to Guardian allies, one copy per ally, and grants +1 INT and life', async () => {
        const catalog = await loadCatalog();
        const antMan = catalog.heroes.find(({_id}) => _id === 'ant-man');
        const definition = catalog.aspects.find(({_id}) =>
            _id === 'leadership-comunicador-implantado');
        const match = new Match({
            mc: {mcSocket: {send() {}}},
            name: 'leadership-comunicador-implantado',
        });
        match.scenario = {
            villain: undefined,
            gameZone: {
                cards: [],
                currentScheme: undefined,
                currentVillain: undefined,
            },
        };
        const matchFactory = new MatchFactory(match);
        const superhero = matchFactory.createSuperhero({
            ...antMan.config,
            cards: [],
            precon: [],
        });
        const player = match.createPlayer({
            name: 'Hombre Hormiga',
            superhero,
            initial: true,
        });
        player.gameZone = new PlayerZone({owner: player});
        player.gameZone.refresh = async () => {};
        player.hand = {cards: [], async refresh() {}};
        player.refresh = async () => {};

        const createAlly = (name, traits = []) =>
            matchFactory.cardsFactory.createGameCardFromConfig({
                type: CARD_TYPE_ALLY,
                params: {
                    name,
                    traits,
                    attack: 1,
                    thwart: 1,
                    hitPoints: 3,
                },
            }, {owner: player});
        const firstGuardian = createAlly('Primer Guardián', [TRAIT_GUARDIAN]);
        const secondGuardian = createAlly('Segundo Guardián', [TRAIT_GUARDIAN]);
        const otherAlly = createAlly('Aliado sin rasgo Guardián');
        for (const ally of [firstGuardian, secondGuardian, otherAlly]) {
            ally.controller = player;
            ally.refresh = async () => {};
            player.gameZone.addToGameZone(ally);
        }

        const communicator = matchFactory.cardsFactory.createGameCardFromConfig(
            definition.card,
            {owner: player},
        );
        communicator.controller = player;
        communicator.refresh = async () => {};
        const attachEffect = communicator.card.createAttachEffect(communicator);

        assert.deepEqual(
            await attachEffect.getValidTarget({match, player}),
            [firstGuardian, secondGuardian],
        );
        attachEffect.selectedTarget = firstGuardian;
        await attachEffect.execute({match, player});
        await communicator.initTriggers({player});

        const [thwartAbility, hitPointsAbility] = communicator.abilities;
        assert.equal(thwartAbility.trigger, TRIGGER_ATTACHED_GET_THWART);
        assert.ok(thwartAbility.effect instanceof ModifyThwartValueEffect);
        assert.equal(typeof thwartAbility.effect.canRun, 'function');
        assert.equal(hitPointsAbility.trigger, TRIGGER_CHARACTER_GET_HIT_POINTS);
        assert.ok(hitPointsAbility.effect instanceof ModifyHitPointsEffect);
        assert.equal(typeof hitPointsAbility.effect.canRun, 'function');
        assert.equal(
            (await firstGuardian.getEffectiveStats({match, player})).thwart,
            2,
        );
        assert.equal(await firstGuardian.getHitPoints({player}), 4);
        assert.equal(
            (await otherAlly.getEffectiveStats({match, player})).thwart,
            1,
        );
        assert.equal(await otherAlly.getHitPoints({player}), 3);

        firstGuardian.damage = 1;
        assert.equal(await firstGuardian.getLife({player}), 3);

        const duplicate = matchFactory.cardsFactory.createGameCardFromConfig(
            definition.card,
            {owner: player},
        );
        const duplicateAttachEffect = duplicate.card.createAttachEffect(duplicate);
        assert.deepEqual(
            await duplicateAttachEffect.getValidTarget({match, player}),
            [secondGuardian],
        );
        assert.equal(
            (await secondGuardian.getEffectiveStats({match, player})).thwart,
            1,
        );
        assert.equal(await secondGuardian.getHitPoints({player}), 3);

        communicator.endTriggers();
        assert.equal(
            (await firstGuardian.getEffectiveStats({match, player})).thwart,
            1,
        );
        assert.equal(await firstGuardian.getHitPoints({player}), 3);
        assert.equal(await firstGuardian.getLife({player}), 2);
        assert.equal(
            (await secondGuardian.getEffectiveStats({match, player})).thwart,
            1,
        );
        assert.equal(await secondGuardian.getHitPoints({player}), 3);
    });

    test('can be played on an ally made Guardian by Star-Lord', async () => {
        const catalog = await loadCatalog();
        const starLord = catalog.heroes.find(({_id}) => _id === 'starlord');
        const blackWidow = catalog.heroes.find(({_id}) => _id === 'black-widow');
        const definition = catalog.aspects.find(({_id}) =>
            _id === 'leadership-comunicador-implantado');
        const match = new Match({
            mc: {mcSocket: {send() {}}},
            name: 'leadership-comunicador-starlord-target',
        });
        match.scenario = {
            villain: undefined,
            gameZone: {
                cards: [],
                currentScheme: undefined,
                currentVillain: undefined,
            },
        };
        const matchFactory = new MatchFactory(match);
        const createPlayer = (name, heroConfig, initial = false) => {
            const superhero = matchFactory.createSuperhero({
                ...heroConfig.config,
                cards: [],
                precon: [],
            });
            const player = match.createPlayer({
                name,
                superhero,
                initial,
            });
            player.gameZone = new PlayerZone({owner: player});
            player.gameZone.refresh = async () => {};
            superhero.refresh = async () => {};

            return {player, superhero};
        };
        const {player, superhero} = createPlayer('Star-Lord', starLord, true);
        superhero.selectedSide = 1;
        const {player: otherPlayer} = createPlayer('Black Widow', blackWidow);

        const createAlly = (owner, name) => {
            const ally = matchFactory.cardsFactory.createGameCardFromConfig({
                type: CARD_TYPE_ALLY,
                params: {
                    name,
                    attack: 1,
                    thwart: 1,
                    hitPoints: 3,
                },
            }, {owner});
            ally.controller = owner;
            ally.refresh = async () => {};
            owner.gameZone.addToGameZone(ally);

            return ally;
        };
        const starLordAlly = createAlly(player, 'Aliado de Star-Lord');
        const secondStarLordAlly = createAlly(
            player,
            'Segundo aliado de Star-Lord',
        );
        const otherPlayerAlly = createAlly(otherPlayer, 'Aliado de otro jugador');
        await superhero.initTriggers({player});

        assert.ok(
            (await starLordAlly.getEffectiveTraits({player}))
                .includes(TRAIT_GUARDIAN),
        );
        assert.equal(
            (await otherPlayerAlly.getEffectiveTraits({player: otherPlayer}))
                .includes(TRAIT_GUARDIAN),
            false,
        );

        const communicator = matchFactory.cardsFactory.createGameCardFromConfig(
            definition.card,
            {owner: player},
        );
        communicator.controller = player;
        const playEffect = new PlayCardEffect({
            card: communicator,
            match,
        });
        const playParams = {
            card: communicator,
            match,
            player,
            playCardEffect: playEffect,
        };

        assert.deepEqual(
            await playEffect.getValidTarget(playParams),
            [starLordAlly, secondStarLordAlly],
        );
        const dialogs = [];
        match.openDialog = async dialog => {
            dialogs.push(dialog);
            return {selected: {id: secondStarLordAlly.id}};
        };
        assert.strictEqual(
            await playEffect.selectTarget(playParams),
            secondStarLordAlly,
        );
        assert.equal(dialogs.length, 1);

        const droppedPlayEffect = new PlayCardEffect({
            card: communicator,
            match,
            targetId: secondStarLordAlly.id,
        });
        await droppedPlayEffect.preselectDroppedTarget({
            ...playParams,
            playCardEffect: droppedPlayEffect,
        });
        assert.strictEqual(
            droppedPlayEffect.selectedTarget,
            secondStarLordAlly,
        );

        const attachEffect = communicator.card.createAttachEffect(communicator);
        attachEffect.selectedTarget = droppedPlayEffect.selectedTarget;
        await attachEffect.execute(playParams);
        assert.strictEqual(communicator.attachedTo, secondStarLordAlly);
    });
});
