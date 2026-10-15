import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    ACTIVATION_ATTACK,
    ACTIVATION_DEFENSE,
    ACTIVATION_RECOVERY,
    ACTIVATION_SCHEME,
    ACTIVATION_THWART,
} from 'mc-shared';
import {Ability} from '../../src/abilities/core/ability.js';
import {ActivationsFactory} from '../../src/factory/activations/activations-factory.js';
import {Effect} from '../../src/effects/effect.js';
import {RecoveryEffect} from '../../src/effects/recovery-effect.js';

const activationCases = [
    {
        name: 'attack',
        effect: {isAttack: true},
        type: ACTIVATION_ATTACK,
    },
    {
        name: 'defense',
        effect: {isDefense: true},
        type: ACTIVATION_DEFENSE,
    },
    {
        name: 'recovery',
        effect: {isRecovery: true},
        type: ACTIVATION_RECOVERY,
    },
    {
        name: 'scheme',
        effect: {isScheme: true},
        type: ACTIVATION_SCHEME,
    },
    {
        name: 'thwart',
        effect: {isThwart: true},
        type: ACTIVATION_THWART,
    },
];

for (const {name, effect: effectParams} of activationCases) {
    test(`creates a fresh ${name} activation for each ability resolution`, async () => {
        const match = {};
        match.activationsFactory = new ActivationsFactory(match);

        const effect = name === 'recovery' ?
            new RecoveryEffect({match}) :
            new Effect({match, ...effectParams});
        const card = {id: 'character'};
        const ability = new Ability({card, effect, match});
        const resolvedActivations = [];
        ability.canRun = async () => true;
        ability.payCosts = async () => true;
        effect.runEffect = async () => {
            resolvedActivations.push(effect.activation);
            effect.resolved = true;
        };

        const staleActivation = effect.activation;
        staleActivation.triggersWouldLaunched = true;
        staleActivation.triggersInitLaunched = true;
        staleActivation.triggersEndsLaunched = true;

        await ability.resolveAbility({
            arrowPaid: true,
            card,
            player: {},
        });

        const firstActivation = resolvedActivations[0];
        assert.notEqual(firstActivation, staleActivation);
        assert.equal(
            firstActivation.constructor.name,
            name[0].toUpperCase() + name.slice(1)
        );
        assert.equal(firstActivation.triggersWouldLaunched, false);
        assert.equal(firstActivation.triggersInitLaunched, false);
        assert.equal(firstActivation.triggersEndsLaunched, false);

        firstActivation.triggersWouldLaunched = true;
        firstActivation.triggersInitLaunched = true;
        firstActivation.triggersEndsLaunched = true;

        await ability.resolveAbility({
            arrowPaid: true,
            card,
            player: {},
        });

        const secondActivation = resolvedActivations[1];
        assert.notEqual(secondActivation, firstActivation);
        assert.equal(secondActivation.triggersWouldLaunched, false);
        assert.equal(secondActivation.triggersInitLaunched, false);
        assert.equal(secondActivation.triggersEndsLaunched, false);
    });
}
