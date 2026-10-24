import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    ABILITY_HERO_ACTION,
    CARD_TYPE_EVENT,
    EFFECT_CHAINED,
    EFFECT_DEAL_DAMAGE,
    TARGET_ENEMY,
} from 'mc-shared';
import {CardsFactory} from '../../src/factory/cards/cards-factory.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';
import {ModifyEffectValueEffect} from '../../src/effects/modify-effect-value-effect.js';
import {
    restoreMatch,
    serializeMatch,
} from '../../src/utils/match-serialization.js';

describe('effect instance definitions', () => {
    test('retains effect-value modifiers in future execution instances', async () => {
        const cardsFactory = new CardsFactory({match: {}});
        const card = cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_EVENT,
            params: {
                abilities: [{
                    type: ABILITY_HERO_ACTION,
                    params: {
                        effect: {
                            type: EFFECT_CHAINED,
                            params: {
                                effects: [{
                                    type: EFFECT_DEAL_DAMAGE,
                                    params: {
                                        damage: 4,
                                        target: TARGET_ENEMY,
                                    },
                                }],
                            },
                        },
                    },
                }],
                cost: 0,
                name: 'Test Event',
                resources: [],
            },
        });
        const ability = card.abilities[0];
        ability.canRun = async () => true;
        await ability.resolveAbility({
            arrowPaid: true,
            cancelEffects: true,
            player: {},
        });

        const damageEffect = ability.effect.effects[0];
        const definitionDamageEffect = ability.effectDefinition.effects[0];
        const modifier = new ModifyEffectValueEffect({
            count: 2,
            effectTypes: [EFFECT_DEAL_DAMAGE],
            match: {},
            property: 'damageModifier',
        });
        modifier.selectedTarget = card;
        modifier.execute();

        const firstInstance = ability.effect.createInstance({ability});

        assert.equal(damageEffect.damageModifier, 2);
        assert.equal(definitionDamageEffect.damageModifier, 2);
        assert.equal(firstInstance.effects[0].damageModifier, 2);

        modifier.execute();
        const secondInstance = ability.effect.createInstance({ability});

        assert.equal(firstInstance.effects[0].damageModifier, 2);
        assert.equal(damageEffect.damageModifier, 4);
        assert.equal(definitionDamageEffect.damageModifier, 4);
        assert.equal(secondInstance.effects[0].damageModifier, 4);
    });

    test('restores cloneable effect definitions and configuration modifiers from snapshots', () => {
        const match = new Match({
            mc: {},
            name: 'effect-instance-snapshot',
        });
        const factory = new MatchFactory(match);
        const card = factory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_EVENT,
            params: {
                abilities: [{
                    type: ABILITY_HERO_ACTION,
                    params: {
                        effect: {
                            type: EFFECT_CHAINED,
                            params: {
                                effects: [{
                                    type: EFFECT_DEAL_DAMAGE,
                                    params: {
                                        damage: 4,
                                        target: TARGET_ENEMY,
                                    },
                                }],
                            },
                        },
                    },
                }],
                cost: 0,
                name: 'Snapshot Event',
                resources: [],
            },
        });
        match.testCard = card;
        card.abilities[0].effectDefinition.effects[0]
            .setConfigValue('damageModifier', 3);

        const restoredMatch = restoreMatch(serializeMatch(match), {});
        const ability = restoredMatch.testCard.abilities[0];
        const definition = ability.effectDefinition;
        const firstInstance = definition.createInstance({ability});
        const secondInstance = definition.createInstance({ability});

        assert.notStrictEqual(definition, firstInstance);
        assert.notStrictEqual(firstInstance, secondInstance);
        assert.notStrictEqual(firstInstance.effects[0], secondInstance.effects[0]);
        assert.equal(firstInstance.effects[0].damageModifier, 3);
        assert.equal(secondInstance.effects[0].damageModifier, 3);
    });
});
