import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    getBasicActivationOption,
    isTargetClickDisabled,
    getTargetMenuOptions,
} from '../src/utils/basic-activation.js';

const attackAbility = (availableTargetIds, overrides = {}) => ({
    availableTargetIds,
    disable: false,
    index: 0,
    isAttack: true,
    isBasic: true,
    isThwart: false,
    ...overrides,
});

test('basic activation options require a matching legal target and ability type', () => {
    const player = {
        superhero: {
            abilities: [
                attackAbility(['villain-1']),
                {
                    availableTargetIds: ['scheme-1'],
                    disable: false,
                    index: 1,
                    isAttack: false,
                    isBasic: true,
                    isThwart: true,
                },
            ],
        },
    };

    assert.deepEqual(
        getBasicActivationOption(player, {id: 'villain-1'}, 'attack'),
        {
            id: 'basic-activation-0',
            text: 'Ataque básico',
            basicActivation: true,
            abilityIndex: 0,
            targetId: 'villain-1',
            activationType: 'attack',
        }
    );
    assert.equal(
        getBasicActivationOption(player, {id: 'scheme-1'}, 'thwart').text,
        'Intervención básica'
    );
    assert.equal(
        getBasicActivationOption(player, {id: 'villain-2'}, 'attack'),
        undefined
    );
    assert.equal(
        getBasicActivationOption(
            {superhero: {abilities: [attackAbility(['scheme-parent'])]}},
            {id: 'scheme-side', parentId: 'scheme-parent'},
            'attack'
        ).targetId,
        'scheme-parent'
    );
});

test('basic activation is the first menu option when another action is available', () => {
    const card = {
        abilities: [{
            index: 2,
            isAction: true,
            name: 'Acción del plan',
        }],
        id: 'side-scheme',
    };
    const option = {
        basicActivation: true,
        id: 'basic-activation-1',
        text: 'Intervención básica',
    };

    assert.deepEqual(getTargetMenuOptions(card, option), [
        option,
        {
            id: 'ability-2',
            text: 'Acción del plan',
            disable: undefined,
        },
    ]);
});

test('a sole basic activation is performed directly and invalid targets add no option', () => {
    const card = {abilities: [], id: 'villain-1'};
    const option = {
        basicActivation: true,
        id: 'basic-activation-0',
        text: 'Ataque básico',
    };

    assert.deepEqual(getTargetMenuOptions(card, option), []);
    assert.deepEqual(getTargetMenuOptions(card, undefined), []);
});

test('a disabled target action does not force a menu ahead of a valid basic activation', () => {
    const card = {
        abilities: [{
            disable: true,
            isAction: true,
            name: 'Acción no disponible',
        }],
        id: 'enemy-1',
    };
    const option = {
        basicActivation: true,
        id: 'basic-activation-0',
        text: 'Ataque básico',
    };

    assert.deepEqual(getTargetMenuOptions(card, option), []);
});

test('a target with no legal activation or available action is not clickable', () => {
    const player = {
        superhero: {
            abilities: [attackAbility([], {disable: true})],
        },
    };

    assert.equal(
        isTargetClickDisabled({abilities: [], id: 'enemy-1'}, player, 'attack'),
        true
    );
    assert.equal(
        isTargetClickDisabled(
            {
                abilities: [{isAction: true, name: 'Usable action'}],
                id: 'enemy-2',
            },
            player,
            'attack'
        ),
        false
    );
});

test('an invalid activation target still menus its available actions', () => {
    const card = {
        abilities: [{index: 2, isAction: true, name: 'Usable action'}],
        id: 'enemy-1',
    };
    const player = {
        superhero: {
            abilities: [attackAbility([], {disable: true})],
        },
    };

    const options = getTargetMenuOptions(
        card,
        getBasicActivationOption(player, card, 'attack'),
        undefined,
        true
    );

    assert.deepEqual(options.map(option => option.id), ['ability-2']);
});
