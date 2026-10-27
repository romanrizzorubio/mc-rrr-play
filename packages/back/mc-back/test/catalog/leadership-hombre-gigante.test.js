import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    ABILITY_CONSTANT,
    CARD_TYPE_ALLY,
    CLASSIFICATION_LEADERSHIP,
    EFFECT_MODIFY_ATTACK_VALUE,
    RESOURCE_PHYSICAL,
    TARGET_EFFECT,
    TRAIT_AVENGER,
    TRAIT_GIANT,
    TRIGGER_THIS_GET_ATTACK,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';
import {PlayerZone} from '../../src/model/match/player-zone.js';

describe('Hombre Gigante (Raz Malhotra)', () => {
    test('applies its conditional ATQ bonus based on remaining life', async () => {
        const catalog = await loadCatalog();
        const antMan = catalog.heroes.find(({_id}) => _id === 'ant-man');
        const definition = catalog.aspects.find(({_id}) =>
            _id === 'leadership-hombre-gigante');
        assert.ok(antMan);
        assert.ok(definition);

        assert.equal(definition.aspect, CLASSIFICATION_LEADERSHIP);
        assert.equal(definition.card.type, CARD_TYPE_ALLY);
        assert.deepEqual(definition.card.params, {
            name: 'Hombre Gigante',
            subtitle: 'Raz Malhotra',
            set: CLASSIFICATION_LEADERSHIP,
            image: 'aspect/leadership/allies/12012.png',
            traits: [TRAIT_AVENGER, TRAIT_GIANT],
            unique: true,
            cost: 5,
            resources: [RESOURCE_PHYSICAL],
            classification: CLASSIFICATION_LEADERSHIP,
            attack: 2,
            thwart: 2,
            attackConsequential: 1,
            thwartConsequential: 1,
            hitPoints: 4,
            abilities: [
                {
                    type: ABILITY_CONSTANT,
                    params: {
                        trigger: TRIGGER_THIS_GET_ATTACK,
                        condition: {
                            'card.life': '>2',
                        },
                        effect: {
                            type: EFFECT_MODIFY_ATTACK_VALUE,
                            params: {
                                target: TARGET_EFFECT,
                                count: 2,
                            },
                        },
                    },
                },
            ],
        });

        const match = new Match({
            mc: {mcSocket: {send() {}}},
            name: 'leadership-hombre-gigante-attack-value',
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
        const giantMan = matchFactory.cardsFactory.createGameCardFromConfig(
            definition.card,
            {owner: player},
        );
        giantMan.controller = player;
        player.gameZone.addToGameZone(giantMan);
        await giantMan.initTriggers();

        const attackAbility = giantMan.abilities.find(({trigger}) =>
            trigger === TRIGGER_THIS_GET_ATTACK);
        assert.ok(attackAbility);
        assert.equal(attackAbility.effect.effectType, EFFECT_MODIFY_ATTACK_VALUE);
        assert.equal(typeof attackAbility.effect.canRun, 'function');
        assert.equal(await giantMan.getAttackValue({match, player}), 4);

        giantMan.damage = 1;
        assert.equal(giantMan.life, 3);
        assert.equal(await giantMan.getAttackValue({match, player}), 4);

        giantMan.damage = 2;
        assert.equal(giantMan.life, 2);
        assert.equal(await giantMan.getAttackValue({match, player}), 2);
    });
});
