import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    ABILITY_HERO_ACTION,
    CARD_TYPE_EVENT,
    CLASSIFICATION_AGGRESSION,
    EFFECT_CHAINED,
    EFFECT_DEAL_DAMAGE,
    EFFECT_DO_IF,
    EFFECT_DRAW_CARD,
    LABEL_ATTACK,
    RESOURCE_MENTAL,
    TARGET_ENEMY,
    TARGET_YOU,
    TRAIT_ATTACK,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {ChainedEffect} from '../../src/effects/chained-effect.js';
import {DealDamageEffect} from '../../src/effects/deal-damage-effect.js';
import {DoIfEffect} from '../../src/effects/do-if-effect.js';
import {MatchFactory} from '../../src/factory/match-factory.js';

describe('Aprovechar la ventaja', () => {
    test('is an Aggression event included three times in Spider-Woman precon', async () => {
        const {aspects, heroes} = await loadCatalog();
        const cardConfig = aspects.find(({_id}) =>
            _id === 'aggression-aprovechar-la-ventaja');
        const spiderwoman = heroes.find(({_id}) => _id === 'spiderwoman');

        assert.ok(cardConfig);
        assert.ok(spiderwoman);
        assert.equal(cardConfig.aspect, CLASSIFICATION_AGGRESSION);
        assert.equal(cardConfig.card.type, CARD_TYPE_EVENT);
        assert.equal(cardConfig.card.params.name, 'Aprovechar la ventaja');
        assert.equal(
            cardConfig.card.params.image,
            'aspect/aggression/events/04043.png'
        );
        assert.deepEqual(cardConfig.card.params.traits, [TRAIT_ATTACK]);
        assert.equal(
            cardConfig.card.params.classification,
            CLASSIFICATION_AGGRESSION
        );
        assert.equal(cardConfig.card.params.cost, 1);
        assert.deepEqual(cardConfig.card.params.resources, [RESOURCE_MENTAL]);

        const preconCard = spiderwoman.config.precon
            .find(({aspect}) => aspect === CLASSIFICATION_AGGRESSION)
            .cardRefs.find(({id}) => id === cardConfig._id);
        assert.equal(preconCard.count, 3);

        const [abilityConfig] = cardConfig.card.params.abilities;
        assert.equal(abilityConfig.type, ABILITY_HERO_ACTION);
        assert.deepEqual(abilityConfig.params.labels, [LABEL_ATTACK]);
        assert.deepEqual(abilityConfig.params.effect, {
            type: EFFECT_CHAINED,
            params: {
                target: TARGET_ENEMY,
                effects: [
                    {
                        type: EFFECT_DEAL_DAMAGE,
                        params: {
                            target: TARGET_ENEMY,
                            damage: 2,
                        },
                    },
                    {
                        type: EFFECT_DO_IF,
                        params: {
                            target: TARGET_ENEMY,
                            condition: [
                                {'effects.0.selectedTarget.isStunned': true},
                                {'effects.0.selectedTarget.isConfused': true},
                            ],
                            effect: {
                                type: EFFECT_DRAW_CARD,
                                params: {
                                    target: TARGET_YOU,
                                    count: 1,
                                },
                            },
                        },
                    },
                ],
            },
        });

        const matchFactory = new MatchFactory({triggerCards: {}});
        const gameCard = matchFactory.cardsFactory.createGameCardFromConfig(
            cardConfig.card,
            {owner: {}}
        );
        const [ability] = gameCard.abilities;
        const [damageEffect, conditionalEffect] = ability.effect.effects;

        assert.ok(ability.effect instanceof ChainedEffect);
        assert.equal(ability.isAttack, true);
        assert.equal(typeof ability.effect.canRun, 'function');
        assert.ok(damageEffect instanceof DealDamageEffect);
        assert.equal(damageEffect.baseDamage, 2);
        assert.equal(damageEffect.target, TARGET_ENEMY);
        assert.ok(conditionalEffect instanceof DoIfEffect);
        assert.equal(conditionalEffect.target, TARGET_ENEMY);
        assert.equal(conditionalEffect.effect.effectType, EFFECT_DRAW_CARD);
        assert.equal(conditionalEffect.effect.target, TARGET_YOU);
    });

    test('draws once when the selected enemy is stunned or confused', async () => {
        const {aspects} = await loadCatalog();
        const cardConfig = aspects.find(({_id}) =>
            _id === 'aggression-aprovechar-la-ventaja');
        const matchFactory = new MatchFactory({triggerCards: {}});
        const statusCases = [
            {isStunned: true, isConfused: false, expectedDraws: 1},
            {isStunned: false, isConfused: true, expectedDraws: 1},
            {isStunned: true, isConfused: true, expectedDraws: 1},
            {isStunned: false, isConfused: false, expectedDraws: 0},
        ];

        for (const {isStunned, isConfused, expectedDraws} of statusCases) {
            const gameCard = matchFactory.cardsFactory.createGameCardFromConfig(
                cardConfig.card,
                {owner: {}}
            );
            const [ability] = gameCard.abilities;
            const [damageEffect, conditionalEffect] = ability.effect.effects;
            const selectedEnemy = {
                id: 'selected-enemy',
                isConfused,
                isEnemy: true,
                isStunned,
            };
            let drawnCards = 0;

            ability.effect.selectedTarget = selectedEnemy;
            damageEffect.canRun = async () => true;
            damageEffect.runEffect = async () => {};
            conditionalEffect.canRun = async () => true;
            conditionalEffect.runEffect = params =>
                conditionalEffect.execute(params);
            conditionalEffect.effect.canRun = async () => true;
            conditionalEffect.effect.runEffect = async () => {
                drawnCards += 1;
            };

            await ability.effect.execute({
                ability,
                match: {},
                player: {},
            });

            assert.strictEqual(damageEffect.selectedTarget, selectedEnemy);
            assert.strictEqual(
                conditionalEffect.selectedTarget,
                selectedEnemy
            );
            assert.equal(drawnCards, expectedDraws);
        }
    });
});
