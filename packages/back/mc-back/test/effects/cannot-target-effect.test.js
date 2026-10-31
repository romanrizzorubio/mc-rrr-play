import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    CARD_TYPE_MINION,
    CARD_TYPE_UPGRADE,
    EFFECT_CATEGORY_DAMAGE,
    EFFECT_DEAL_DAMAGE,
    EFFECT_READY,
    EFFECT_TAKE_DAMAGE,
    TRAIT_HYDRA,
} from 'mc-shared';
import {CannotTargetEffect} from '../../src/effects/cannot-target-effect.js';

describe('CannotTargetEffect', () => {
    test('CannotTargetEffect matches effect categories, target conditions, and optional conditions', () => {
        let planInPlay = true;
        const plan = {name: 'Legiones de Hydra'};
        const validation = new CannotTargetEffect({
            condition: {name: 'Legiones de Hydra'},
            effectCondition: {
                'source.type': CARD_TYPE_UPGRADE,
                'source.traits': TRAIT_HYDRA,
            },
            effectCategories: [EFFECT_CATEGORY_DAMAGE],
            match: {
                searchCard(condition) {
                    return planInPlay && condition.name === plan.name ? plan : undefined;
                },
            },
            targetCondition: {
                type: CARD_TYPE_MINION,
                traits: TRAIT_HYDRA,
            },
        });
        const effect = {
            effectCategories: [EFFECT_CATEGORY_DAMAGE],
            source: {
                type: CARD_TYPE_UPGRADE,
                traits: [TRAIT_HYDRA],
            },
        };
        const targetCard = {
            traits: [TRAIT_HYDRA],
            type: CARD_TYPE_MINION,
        };

        assert.equal(validation.isInvalidTarget({effect, targetCard}), true);
        assert.equal(validation.isInvalidTarget({
            effect: {
                ...effect,
                source: undefined,
                ability: {card: effect.source},
            },
            targetCard,
        }), true);
        planInPlay = false;
        assert.equal(validation.isInvalidTarget({effect, targetCard}), false);
        planInPlay = true;
        assert.equal(validation.isInvalidTarget({
            effect: {...effect, source: {type: CARD_TYPE_UPGRADE, traits: []}},
            targetCard,
        }), false);
        assert.equal(validation.isInvalidTarget({
            effect,
            targetCard: {traits: [], type: CARD_TYPE_MINION},
        }), false);
        assert.equal(validation.isInvalidTarget({
            effect: {...effect, effectCategories: []},
            targetCard,
        }), false);
    });

    test('CannotTargetEffect can match individual effect types and defaults to an unconditional restriction', () => {
        const validation = new CannotTargetEffect({
            effectTypes: [EFFECT_DEAL_DAMAGE, EFFECT_TAKE_DAMAGE],
        });
        const targetCard = {};

        assert.equal(validation.isInvalidTarget({
            effect: {effectType: EFFECT_DEAL_DAMAGE},
            targetCard,
        }), true);
        assert.equal(validation.isInvalidTarget({
            effect: {effectType: EFFECT_TAKE_DAMAGE},
            targetCard,
        }), true);
        assert.equal(validation.isInvalidTarget({
            effect: {effectType: EFFECT_READY},
            targetCard,
        }), false);
        assert.throws(() => new CannotTargetEffect({}), /requires effectTypes or effectCategories/);
    });

    test('CannotTargetEffect matches another minion engaged with the same player and respects blank text', () => {
        const player = {};
        const otherPlayer = {};
        const edison = {
            engaged: player,
            isMinion: true,
        };
        let minions = [edison, {
            engaged: player,
            isMinion: true,
        }];
        const validation = new CannotTargetEffect({
            condition: {isMinion: true},
            conditionTargetMatch: 'engaged',
            effectCategories: [EFFECT_CATEGORY_DAMAGE],
            match: {
                searchCards(condition) {
                    return minions.filter(card => card.isMinion === condition.isMinion);
                },
            },
        });
        const effect = {effectCategories: [EFFECT_CATEGORY_DAMAGE]};

        assert.equal(validation.isInvalidTarget({effect, targetCard: edison}), true);
        minions = [edison];
        assert.equal(validation.isInvalidTarget({effect, targetCard: edison}), false);
        minions = [edison, {engaged: otherPlayer, isMinion: true}];
        assert.equal(validation.isInvalidTarget({effect, targetCard: edison}), false);

        validation.ability = {card: {printedTextBlank: true}};
        minions = [edison, {engaged: player, isMinion: true}];
        assert.equal(validation.isInvalidTarget({effect, targetCard: edison}), false);
    });

    test('CannotTargetEffect checks scenario conditions in the source card zone', () => {
        const sourcePlayer = {};
        const otherPlayer = {};
        const sourceZone = {players: [sourcePlayer]};
        const sourceCard = {scenarioZone: sourceZone};
        let minions = [{isMinion: true, scenarioZone: sourceZone}];
        const validation = new CannotTargetEffect({
            condition: {isMinion: true},
            effectCategories: [EFFECT_CATEGORY_DAMAGE],
            match: {
                getScenarioZoneForCard(card) {
                    return card.scenarioZone;
                },
                searchCards(_condition, player) {
                    const zone = player === sourcePlayer ?
                        sourceZone :
                        {players: [otherPlayer]};
                    return minions.filter(card => card.scenarioZone === zone);
                },
            },
            targetCondition: {isVillain: true},
        });
        validation.ability = {card: sourceCard};

        assert.equal(validation.isInvalidTarget({
            effect: {effectCategories: [EFFECT_CATEGORY_DAMAGE]},
            targetCard: {isVillain: true},
        }), true);
        minions = [{isMinion: true, scenarioZone: {players: [otherPlayer]}}];
        assert.equal(validation.isInvalidTarget({
            effect: {effectCategories: [EFFECT_CATEGORY_DAMAGE]},
            targetCard: {isVillain: true},
        }), false);
    });

    test('validation protects only its owning card unless targetCondition is explicit', () => {
        const sourceCard = {};
        const otherCard = {};
        const validation = new CannotTargetEffect({
            effectCategories: [EFFECT_CATEGORY_DAMAGE],
        });
        validation.ability = {card: sourceCard};
        const effect = {effectCategories: [EFFECT_CATEGORY_DAMAGE]};

        assert.equal(validation.isInvalidTarget({effect, targetCard: sourceCard}), true);
        assert.equal(validation.isInvalidTarget({effect, targetCard: otherCard}), false);
        validation.targetCondition = {isVillain: true};
        assert.equal(validation.isInvalidTarget({
            effect, targetCard: {...otherCard, isVillain: true},
        }), true);
        assert.equal(validation.isInvalidTarget({effect, targetCard: sourceCard}), false);
    });

    test('self protection recognizes a card and its active side without protecting another card', () => {
        const parent = {};
        const side = {parent};
        const validation = new CannotTargetEffect({
            effectCategories: [EFFECT_CATEGORY_DAMAGE],
        });
        validation.ability = {card: side};
        const effect = {effectCategories: [EFFECT_CATEGORY_DAMAGE]};

        assert.equal(validation.isInvalidTarget({effect, targetCard: side}), true);
        assert.equal(validation.isInvalidTarget({effect, targetCard: parent}), true);
        assert.equal(validation.isInvalidTarget({effect, targetCard: {}}), false);
        validation.ability.card = parent;
        assert.equal(validation.isInvalidTarget({effect, targetCard: side}), true);
    });
});
