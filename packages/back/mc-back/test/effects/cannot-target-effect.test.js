import assert from 'node:assert/strict';
import {test} from 'node:test';

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
