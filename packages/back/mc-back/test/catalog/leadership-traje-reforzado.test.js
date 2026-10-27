import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    ABILITY_CONSTANT,
    CARD_TYPE_ALLY,
    CARD_TYPE_UPGRADE,
    CLASSIFICATION_LEADERSHIP,
    EFFECT_MODIFY_HIT_POINTS,
    RESOURCE_ENERGY,
    TARGET_ALLY,
    TARGET_ATTACHED,
    TRAIT_ARMOR,
    TRAIT_TECH,
    TRIGGER_CHARACTER_GET_HIT_POINTS,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {ModifyHitPointsEffect} from '../../src/effects/modify-hit-points-effect.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';
import {PlayerZone} from '../../src/model/match/player-zone.js';

describe('Traje reforzado', () => {
    test('defines the upgrade and includes three copies in the Ant-Man precon', async () => {
        const catalog = await loadCatalog();
        const antMan = catalog.heroes.find(({_id}) => _id === 'ant-man');
        const suit = catalog.aspects.find(({_id}) =>
            _id === 'leadership-traje-reforzado');

        assert.ok(antMan);
        assert.ok(suit);
        assert.equal(suit.aspect, CLASSIFICATION_LEADERSHIP);
        assert.deepEqual(suit.card, {
            type: CARD_TYPE_UPGRADE,
            params: {
                name: 'Traje reforzado',
                set: CLASSIFICATION_LEADERSHIP,
                image: 'aspect/leadership/upgrades/12018.png',
                traits: [TRAIT_ARMOR, TRAIT_TECH],
                cost: 1,
                resources: [RESOURCE_ENERGY],
                classification: CLASSIFICATION_LEADERSHIP,
                attach: TARGET_ALLY,
                maxAttach: 1,
                abilities: [
                    {
                        type: ABILITY_CONSTANT,
                        params: {
                            trigger: TRIGGER_CHARACTER_GET_HIT_POINTS,
                            effect: {
                                type: EFFECT_MODIFY_HIT_POINTS,
                                params: {
                                    target: TARGET_ATTACHED,
                                    count: 2,
                                },
                            },
                        },
                    },
                ],
            },
        });

        const precon = antMan.config.precon.find(({aspect}) =>
            aspect === CLASSIFICATION_LEADERSHIP);
        assert.ok(precon);
        assert.ok(precon.cardRefs.some(({id, count}) =>
            id === suit._id && count === 3));
    });

    test('adds two hit points to its attached ally and allows one copy per ally', async () => {
        const catalog = await loadCatalog();
        const antMan = catalog.heroes.find(({_id}) => _id === 'ant-man');
        const definition = catalog.aspects.find(({_id}) =>
            _id === 'leadership-traje-reforzado');
        const match = new Match({
            mc: {mcSocket: {send() {}}},
            name: 'leadership-traje-reforzado',
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

        const createAlly = name => matchFactory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_ALLY,
            params: {
                name,
                attack: 1,
                thwart: 1,
                hitPoints: 3,
            },
        }, {owner: player});
        const ally = createAlly('Aliado vinculado');
        const otherAlly = createAlly('Otro aliado');
        for (const character of [ally, otherAlly]) {
            character.controller = player;
            character.refresh = async () => {};
            player.gameZone.addToGameZone(character);
        }

        const suit = matchFactory.cardsFactory.createGameCardFromConfig(
            definition.card,
            {owner: player},
        );
        suit.controller = player;
        suit.refresh = async () => {};
        const attachEffect = suit.card.createAttachEffect(suit);

        assert.deepEqual(
            await attachEffect.getValidTarget({match, player}),
            [ally, otherAlly],
        );
        attachEffect.selectedTarget = ally;
        await attachEffect.execute({match, player});
        await suit.initTriggers({player});

        const [healthAbility] = suit.abilities;
        assert.equal(healthAbility.trigger, TRIGGER_CHARACTER_GET_HIT_POINTS);
        assert.ok(healthAbility.effect instanceof ModifyHitPointsEffect);
        assert.equal(healthAbility.effect.target, TARGET_ATTACHED);
        assert.equal(typeof healthAbility.effect.canRun, 'function');
        assert.equal(await ally.getHitPoints({player}), 5);
        ally.damage = 1;
        assert.equal(await ally.getLife({player}), 4);

        const duplicate = matchFactory.cardsFactory.createGameCardFromConfig(
            definition.card,
            {owner: player},
        );
        const duplicateAttachEffect = duplicate.card.createAttachEffect(duplicate);
        assert.deepEqual(
            await duplicateAttachEffect.getValidTarget({match, player}),
            [otherAlly],
        );
        duplicateAttachEffect.selectedTarget = otherAlly;
        await duplicateAttachEffect.execute({match, player});
        await duplicate.initTriggers({player});
        assert.equal(await otherAlly.getHitPoints({player}), 5);

        suit.endTriggers();
        assert.equal(await ally.getHitPoints({player}), 3);
        assert.equal(await ally.getLife({player}), 2);
    });
});
