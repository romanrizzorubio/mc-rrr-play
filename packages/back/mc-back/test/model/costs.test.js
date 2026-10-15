import assert from 'node:assert/strict';
import test from 'node:test';

import {
    EFFECT_CHAINED,
    EFFECT_CHOOSE,
    EFFECT_DELAYED,
    EFFECT_DO_IF,
    EFFECT_DO_IF_CARD_GAME,
    EFFECT_DO_IF_HAS_DAMAGE,
    EFFECT_DO_IF_HAS_PAID,
    EFFECT_DO_IF_HAS_TRAITS,
    EFFECT_DO_IF_TARGET,
    EFFECT_DO_IF_TAKE_DAMAGE,
    EFFECT_LASTING,
    EFFECT_MAY,
    EFFECT_REPLACE_EFFECT,
    EFFECT_SIMULTANEOUS,
} from 'mc-shared';
import {Effect} from '../../src/effects/effect.js';
import {AdditionalCost} from '../../src/model/costs/additional-cost.js';

test('marks children of composite effect types as costs', () => {
    const cases = [
        [EFFECT_CHAINED, ['effects']],
        [EFFECT_SIMULTANEOUS, ['effects']],
        [EFFECT_CHOOSE, ['options']],
        [EFFECT_DELAYED, ['effect']],
        [EFFECT_DO_IF, ['effect', 'effectNot']],
        [EFFECT_DO_IF_CARD_GAME, ['effect', 'effectNot']],
        [EFFECT_DO_IF_HAS_DAMAGE, ['effect', 'effectNot']],
        [EFFECT_DO_IF_HAS_PAID, ['effect', 'effectNot']],
        [EFFECT_DO_IF_HAS_TRAITS, ['effect', 'effectNot']],
        [EFFECT_DO_IF_TARGET, ['effect', 'effectNot']],
        [EFFECT_DO_IF_TAKE_DAMAGE, ['effect', 'effectNot']],
        [EFFECT_LASTING, ['effect', 'endEffect']],
        [EFFECT_MAY, ['effect']],
        [EFFECT_REPLACE_EFFECT, ['replacement']],
    ];

    for (const [effectType, childKeys] of cases) {
        const children = childKeys.map(() => new Effect({}));
        const effect = new Effect({
            effectType,
            thenEffect: new Effect({}),
        });

        childKeys.forEach((key, index) => {
            effect[key] = key === 'effects' || key === 'options' ?
                [children[index]] :
                children[index];
        });

        new AdditionalCost({effect}).getEffect({});

        assert.equal(effect.isCost, true, `${effectType} root`);
        assert.equal(effect.thenEffect.isCost, true, `${effectType} thenEffect`);
        children.forEach((child, index) => {
            assert.equal(child.isCost, true, `${effectType} ${childKeys[index]}`);
        });
    }
});
