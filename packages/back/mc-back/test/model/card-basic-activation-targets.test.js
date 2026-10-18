import assert from 'node:assert/strict';
import {test} from 'node:test';

import {RESOURCE_ENERGY} from 'mc-shared';
import {GameCard} from '../../src/model/cards/game-card.js';

test('basic character abilities serialize their legal activation targets', async () => {
    const target = {id: 'villain-stage-1'};
    const ability = {
        effect: {
            async getValidTarget(params) {
                assert.equal(params.card, card);
                assert.equal(params.player, player);
                return [target];
            },
        },
        async canRun() {
            return true;
        },
        isAction: false,
        isAttack: true,
        isBasic: true,
        isThwart: false,
        prepareEffect() {},
        toObj() {
            return {isBasic: true};
        },
    };
    const card = Object.assign(Object.create(GameCard.prototype), {
        attached: [],
        abilities: [ability],
        sides: [],
    });
    const player = {};

    const result = await card.getAbilityAvailability(player);

    assert.deepEqual(result.abilities[0], {
        isBasic: true,
        index: 0,
        isAttack: true,
        isThwart: false,
        disable: false,
        availableTargetIds: ['villain-stage-1'],
    });
});

test('targeted action abilities serialize their legal activation targets', async () => {
    const target = {id: 'villain-stage-1'};
    const ability = {
        effect: {
            async getValidTarget(params) {
                assert.equal(params.card, card);
                assert.equal(params.player, player);
                return [target];
            },
        },
        async canRun() {
            return true;
        },
        isAction: true,
        isAttack: true,
        isBasic: false,
        isThwart: false,
        name: 'Disparar',
        prepareEffect() {},
        toObj() {
            return {
                isAction: true,
                isBasic: false,
                name: this.name,
            };
        },
    };
    const card = Object.assign(Object.create(GameCard.prototype), {
        attached: [],
        abilities: [ability],
        sides: [],
    });
    const player = {};

    const result = await card.getAbilityAvailability(player);

    assert.deepEqual(result.abilities[0], {
        isAction: true,
        isBasic: false,
        name: 'Disparar',
        index: 0,
        isAttack: true,
        isThwart: false,
        disable: false,
        availableTargetIds: ['villain-stage-1'],
    });
});

test('resource payment availability exposes hand and generator sources', async () => {
    const ability = {
        arrow: {
            cost: {
                resourceType: RESOURCE_ENERGY,
            },
        },
        async canRun() {
            return true;
        },
        isAction: true,
        isAttack: false,
        isBasic: false,
        isThwart: false,
        name: 'Cargar',
        prepareEffect() {},
        toObj() {
            return {
                isAction: true,
                isBasic: false,
                name: this.name,
            };
        },
    };
    const card = Object.assign(Object.create(GameCard.prototype), {
        attached: [],
        abilities: [ability],
        sides: [],
    });
    const player = {
        async getCardsToPay(cardToPay, resourceType) {
            assert.equal(cardToPay, card);
            assert.equal(resourceType, RESOURCE_ENERGY);

            return {
                generators: [{id: 'generator-1'}],
                hand: [{id: 'resource-1'}],
            };
        },
    };

    const result = await card.getAbilityAvailability(player);

    assert.deepEqual(result.abilities[0].resourcePayment, {
        resourceType: RESOURCE_ENERGY,
        sourceIds: ['resource-1', 'generator-1'],
    });
});

test('basic character abilities have no available targets when disabled', async () => {
    let targetSearchCount = 0;
    const ability = {
        effect: {
            async getValidTarget() {
                targetSearchCount += 1;
                return [{id: 'villain-stage-1'}];
            },
        },
        async canRun() {
            return false;
        },
        isAction: false,
        isAttack: true,
        isBasic: true,
        isThwart: false,
        prepareEffect() {},
        toObj() {
            return {isBasic: true};
        },
    };
    const card = Object.assign(Object.create(GameCard.prototype), {
        attached: [],
        abilities: [ability],
        sides: [],
    });

    const result = await card.getAbilityAvailability({});

    assert.equal(result.abilities[0].disable, true);
    assert.equal('availableTargetIds' in result.abilities[0], false);
    assert.equal(targetSearchCount, 0);
});
