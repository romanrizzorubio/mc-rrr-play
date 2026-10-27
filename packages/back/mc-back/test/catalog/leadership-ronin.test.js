import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    ABILITY_CONSTANT,
    CARD_TYPE_ALLY,
    CARD_TYPE_UPGRADE,
    CLASSIFICATION_LEADERSHIP,
    EFFECT_MODIFY_ATTACK_VALUE,
    EFFECT_MODIFY_THWART_VALUE,
    RESOURCE_ENERGY,
    TARGET_EFFECT,
    TRAIT_AVENGER,
    TRIGGER_THIS_GET_ATTACK,
    TRIGGER_THIS_GET_THWART,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';
import {PlayerZone} from '../../src/model/match/player-zone.js';

describe('Ronin', () => {
    test('is included in the Ant-Man precon with its printed stats and abilities', async () => {
        const catalog = await loadCatalog();
        const antMan = catalog.heroes.find(({_id}) => _id === 'ant-man');
        const definition = catalog.aspects.find(({_id}) =>
            _id === 'leadership-ronin');

        assert.ok(antMan);
        assert.ok(definition);
        assert.equal(definition.aspect, CLASSIFICATION_LEADERSHIP);
        assert.deepEqual(
            antMan.config.precon
                .find(({aspect}) => aspect === CLASSIFICATION_LEADERSHIP)
                .cardRefs.find(({id}) => id === definition._id),
            {id: definition._id, count: 1},
        );
        assert.equal(definition.card.type, CARD_TYPE_ALLY);
        assert.deepEqual(definition.card.params, {
            name: 'Ronin',
            set: CLASSIFICATION_LEADERSHIP,
            image: 'aspect/leadership/allies/12013.png',
            traits: [TRAIT_AVENGER],
            unique: true,
            cost: 3,
            resources: [RESOURCE_ENERGY],
            classification: CLASSIFICATION_LEADERSHIP,
            attack: 2,
            thwart: 1,
            attackConsequential: 1,
            thwartConsequential: 1,
            hitPoints: 3,
            abilities: [
                {
                    type: ABILITY_CONSTANT,
                    params: {
                        trigger: TRIGGER_THIS_GET_ATTACK,
                        condition: {
                            'card.attached.*.isUpgrade': true,
                        },
                        effect: {
                            type: EFFECT_MODIFY_ATTACK_VALUE,
                            params: {
                                target: TARGET_EFFECT,
                                count: 1,
                            },
                        },
                    },
                },
                {
                    type: ABILITY_CONSTANT,
                    params: {
                        trigger: TRIGGER_THIS_GET_THWART,
                        condition: {
                            'card.attached.*.isUpgrade': true,
                        },
                        effect: {
                            type: EFFECT_MODIFY_THWART_VALUE,
                            params: {
                                target: TARGET_EFFECT,
                                count: 1,
                            },
                        },
                    },
                },
            ],
        });

        const match = new Match({
            mc: {mcSocket: {send() {}}},
            name: 'leadership-ronin-stats',
        });
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

        const ronin = matchFactory.cardsFactory.createGameCardFromConfig(
            definition.card,
            {owner: player},
        );
        ronin.controller = player;
        player.gameZone.addToGameZone(ronin);
        await ronin.initTriggers();

        const attackAbility = ronin.abilities.find(({trigger}) =>
            trigger === TRIGGER_THIS_GET_ATTACK);
        const thwartAbility = ronin.abilities.find(({trigger}) =>
            trigger === TRIGGER_THIS_GET_THWART);
        assert.ok(attackAbility);
        assert.equal(attackAbility.effect.effectType, EFFECT_MODIFY_ATTACK_VALUE);
        assert.equal(typeof attackAbility.effect.canRun, 'function');
        assert.ok(thwartAbility);
        assert.equal(thwartAbility.effect.effectType, EFFECT_MODIFY_THWART_VALUE);
        assert.equal(typeof thwartAbility.effect.canRun, 'function');

        const getStats = () => ronin.getEffectiveStats({match, player});
        const baseStats = await getStats();
        assert.deepEqual([baseStats.attack, baseStats.thwart], [2, 1]);

        const upgrade = matchFactory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_UPGRADE,
            params: {
                name: 'Mejora de prueba',
            },
        }, {owner: player});
        ronin.attached.push(upgrade);
        upgrade.attachedTo = ronin;

        const upgradedStats = await getStats();
        assert.deepEqual([upgradedStats.attack, upgradedStats.thwart], [3, 2]);

        await upgrade.init();
        const detachedStats = await getStats();
        assert.deepEqual([detachedStats.attack, detachedStats.thwart], [2, 1]);
    });
});
