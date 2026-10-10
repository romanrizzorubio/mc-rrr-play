import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    ACTIVATION_DEFENSE,
    TARGET_YOUR_SUPERHERO,
} from 'mc-shared';
import {Defense} from '../../src/activations/defense.js';
import {PreventDamageEffect} from '../../src/effects/prevent-damage-effect.js';

test('a defense event prevents damage outside an attack without requiring a defender card', async () => {
    const superhero = {
        id: 'captain-america',
        isCard: true,
        name: 'Capitán América',
    };
    const player = {
        canDefend: params => {
            assert.equal(params.attack, undefined);

            return true;
        },
    };
    const match = {
        activationsFactory: {
            createActivation({effect, type}) {
                assert.equal(type, ACTIVATION_DEFENSE);

                return new Defense({effect});
            },
        },
    };
    const damageEffect = {
        damage: 2,
        preventDamage: 0,
        selectedTarget: superhero,
        takenDamage: 2,
    };
    const preventDamage = new PreventDamageEffect({
        ability: {isDefense: true},
        damage: 2,
        match,
        selectedTarget: superhero,
        target: TARGET_YOUR_SUPERHERO,
    });
    const params = {
        player,
        effect: damageEffect,
        triggeredEffect: damageEffect,
        triggeredTarget: superhero,
        triggeredTargetDamage: 2,
    };

    assert.equal(await preventDamage.canRun(params), true);
    preventDamage.execute(params);

    assert.equal(damageEffect.preventDamage, 2);
});
