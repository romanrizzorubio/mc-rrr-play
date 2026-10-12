import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    ABILITY_HERO_ACTION,
    CARD_TYPE_EVENT,
    EFFECT_CHAINED,
    EFFECT_DEAL_DAMAGE,
    EFFECT_REMOVE_THREAT,
    TARGET_ENEMY,
    TARGET_SCHEME,
} from 'mc-shared';
import {CardsFactory} from '../../src/factory/cards/cards-factory.js';
import {ModifyEffectValueEffect} from '../../src/effects/modify-effect-value-effect.js';
import aggressionEvents from '../../../mc-data/seed/catalog/aspects/aggression/events.js';
import msMarvel from '../../../mc-data/seed/catalog/heroes/ms-marvel.js';

test('ModifyEffectValueEffect updates matching effects nested in a played card', () => {
    const cardsFactory = new CardsFactory({match: {}});
    const targetCard = cardsFactory.createGameCardFromConfig({
        type: CARD_TYPE_EVENT,
        params: {
            abilities: [{
                type: ABILITY_HERO_ACTION,
                params: {
                    effect: {
                        type: EFFECT_CHAINED,
                        params: {
                            effects: [
                                {
                                    type: EFFECT_DEAL_DAMAGE,
                                    params: {
                                        damage: 4,
                                        target: TARGET_ENEMY,
                                    },
                                },
                                {
                                    type: EFFECT_REMOVE_THREAT,
                                    params: {
                                        target: TARGET_SCHEME,
                                        threat: 3,
                                    },
                                },
                            ],
                        },
                    },
                },
            }],
            cost: 0,
            name: 'Test Event',
            resources: [],
        },
    });
    const [dealDamage, removeThreat] = targetCard.abilities[0].effect.effects;
    const damageModifier = new ModifyEffectValueEffect({
        count: 2,
        effectTypes: [EFFECT_DEAL_DAMAGE],
        property: 'damageModifier',
    });
    damageModifier.selectedTarget = targetCard;
    damageModifier.execute();

    assert.equal(dealDamage.damageModifier, 2);
    assert.equal(removeThreat.threatModifier, 0);

    const threatModifier = new ModifyEffectValueEffect({
        count: 2,
        effectTypes: [EFFECT_REMOVE_THREAT],
        property: 'threatModifier',
    });
    threatModifier.selectedTarget = targetCard;
    threatModifier.execute();

    assert.equal(removeThreat.threatModifier, 2);
});

test('Agrandar increases damage for both Cuerpo a cuerpo attacks', async () => {
    const match = {
        activationsFactory: {
            createActivation: () => ({
                getOverkill: () => false,
            }),
        },
        triggerCards: {},
    };
    const cardsFactory = new CardsFactory({match});
    const cuerpoACuerpoConfig = aggressionEvents.find(({card}) =>
        card.params.name === 'Cuerpo a cuerpo')?.card;
    const agrandarConfig = msMarvel.config.cards.find(({card}) =>
        card.params.name === '¡Agrandar!')?.card;

    assert.ok(cuerpoACuerpoConfig);
    assert.ok(agrandarConfig);

    const cuerpoACuerpo = cardsFactory.createGameCardFromConfig(cuerpoACuerpoConfig);
    const agrandar = cardsFactory.createGameCardFromConfig(agrandarConfig);
    const damageEffects = cuerpoACuerpo.abilities[0].effect.effects;
    const player = {isHero: true, isPlayer: true};

    await agrandar.abilities[0].resolveAbility({
        arrowPaid: true,
        card: agrandar,
        effect: {card: cuerpoACuerpo},
        player,
        triggeredCard: cuerpoACuerpo,
    });

    damageEffects[0].selectedTarget = {id: 'enemy-1'};
    damageEffects[1].selectedTarget = {id: 'enemy-2'};
    await Promise.all(damageEffects.map(effect => effect.prepare({player})));

    assert.deepEqual(damageEffects.map(effect => effect.damage), [5, 5]);
});
