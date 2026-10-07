import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    ABILITY_FORCED_RESPONSE,
    ABILITY_OPTION,
    CARD_TYPE_MINION,
    EFFECT_CHOOSE,
    EFFECT_CHOOSE_ABILITY,
    EFFECT_CONVERT_FACEDOWN_CARD,
    EFFECT_PUT_FACEDOWN_CARD_IN_PLAY,
    EFFECT_PLACE_THREAT,
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    TARGET_ALL_PLAYERS,
    TRAIT_DRONE,
    TRIGGER_FACEDOWN_CARD,
    TRIGGER_PLACE_THREAT,
    TRIGGER_VILLAIN_ATTACKS_YOU,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';

const findValues = (value, predicate, found = []) => {
    if (!value || typeof value !== 'object') {
        return found;
    }

    if (predicate(value)) {
        found.push(value);
    }

    Object.values(value).forEach(item => findValues(item, predicate, found));

    return found;
};

test('Ultron scenario is available with the expected encounter cards and modular set', async () => {
    const {scenarios} = await loadCatalog();
    const ultron = scenarios.find(({_id}) => _id === 'ultron');

    assert.ok(ultron);
    assert.deepEqual(ultron.config.sets, ['standard']);
    assert.deepEqual(ultron.config.defaultSets, ['under-attack']);
    assert.equal(ultron.config.villains.length, 3);
    assert.equal(ultron.config.mainSchemes.length, 3);
    assert.equal(
        ultron.config.cards.reduce((count, {count: copies}) => count + copies, 0),
        19
    );

    const stageOneAttackResponse = ultron.config.villains[0].params.abilities.find(
        ({params}) => params.trigger === TRIGGER_VILLAIN_ATTACKS_YOU
    );
    const stageOneOptions = stageOneAttackResponse.params.effect.params.options;

    assert.equal(
        stageOneAttackResponse.params.effect.type,
        EFFECT_CHOOSE_ABILITY
    );
    assert.deepEqual(stageOneOptions.map(({type}) => type), [
        ABILITY_OPTION,
        ABILITY_OPTION,
    ]);
    assert.deepEqual(stageOneOptions.map(({params}) => params.effect.type), [
        EFFECT_PLACE_THREAT,
        EFFECT_PUT_FACEDOWN_CARD_IN_PLAY,
    ]);
    assert.ok(stageOneOptions.every(({params}) => params.name));

    const stageTwoThreatResponses = findValues(ultron.config, value =>
        value.type === ABILITY_FORCED_RESPONSE &&
        value.params?.trigger === TRIGGER_PLACE_THREAT);

    assert.equal(stageTwoThreatResponses.length, 1);
    assert.deepEqual(stageTwoThreatResponses[0].params.condition, {
        'effect.isAccelerationThreat': true,
        'effect.selectedTarget.isMainScheme': true,
    });

    const allPlayerChoiceWrappers = findValues(ultron.config, value =>
        value.type === EFFECT_CHOOSE_ABILITY &&
        value.params.options?.length === 1 &&
        value.params.options[0].type === ABILITY_OPTION &&
        value.params.options[0].params.effect.type === EFFECT_CHOOSE &&
        value.params.options[0].params.effect.params.players === TARGET_ALL_PLAYERS);

    assert.equal(allPlayerChoiceWrappers.length, 1);

    const droneEnvironment = ultron.config.cards.find(({card}) =>
        card.params.name === 'Drones de Ultrón').card;
    const conversionAbility = droneEnvironment.params.abilities[0];

    assert.equal(Object.hasOwn(droneEnvironment.params, 'minionStats'), false);
    assert.equal(conversionAbility.params.trigger, TRIGGER_FACEDOWN_CARD);
    assert.equal(conversionAbility.params.effect.type, EFFECT_CONVERT_FACEDOWN_CARD);
    assert.equal(
        Object.hasOwn(conversionAbility.params.effect.params, 'target'),
        false
    );
    assert.equal(conversionAbility.params.effect.params.cardType, CARD_TYPE_MINION);
    assert.deepEqual(conversionAbility.params.effect.params.cardParams, {
        attack: 1,
        hitPoints: 1,
        name: 'Dron boca abajo',
        scheme: 1,
        traits: [TRAIT_DRONE],
    });

    const efficacyCards = ultron.config.cards.filter(({card}) =>
        card.params.name === 'Eficacia androide');

    assert.equal(efficacyCards.length, 3);
    assert.deepEqual(efficacyCards.map(({card}) => card.params.boost), [0, 0, 0]);
    assert.deepEqual(efficacyCards.map(({card}) =>
        card.params.boostAbility.params.effect.params.options[0].params), [
        {
            resources: [RESOURCE_ENERGY],
            title: 'Gasta 1 recurso de energía',
        },
        {
            resources: [RESOURCE_MENTAL],
            title: 'Gasta 1 recurso mental',
        },
        {
            resources: [RESOURCE_PHYSICAL],
            title: 'Gasta 1 recurso físico',
        },
    ]);
});
