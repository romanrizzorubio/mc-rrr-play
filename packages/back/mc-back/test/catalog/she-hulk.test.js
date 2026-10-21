import assert from 'node:assert/strict';
import {test} from 'node:test';

import {TARGET_ROUND, TARGET_SCHEME} from 'mc-shared';
import sheHulk from '../../../mc-data/seed/catalog/heroes/she-hulk.js';
import {CardsFactory} from '../../src/factory/cards/cards-factory.js';
import {Effect} from '../../src/effects/effect.js';
import {PlaceThreatEffect} from '../../src/effects/place-threat-effect.js';
import {Match} from '../../src/model/match/match.js';
import {
    restoreMatch,
    serializeMatch,
} from '../../src/utils/match-serialization.js';

const createIdentity = (match, player) => {
    const alterEgoConfig = {
        ...sheHulk.config.sides[0],
        params: {
            ...sheHulk.config.sides[0].params,
        },
    };
    const cardsFactory = new CardsFactory({match});
    return cardsFactory.createGameCardFromConfig(alterEgoConfig, {owner: player});
};

const createProtesto = () => {
    const match = {
        limits: {},
        triggerCards: {},
    };
    const player = {
        isAlterEgo: true,
        isPlayer: true,
    };
    const identity = createIdentity(match, player);
    const ability = identity.abilities.find(({name}) => name === '¡Protesto!');

    assert.ok(ability);

    return {ability, match, player};
};

const createThreatEffect = (match, selectedTarget) => new PlaceThreatEffect({
    match,
    selectedTarget,
    target: TARGET_SCHEME,
    threat: 1,
});

test('Protesto only interrupts threat placements on schemes', async () => {
    const {ability, match, player} = createProtesto();
    const mainScheme = {isMainScheme: true, isScheme: true};
    const sideScheme = {isSideScheme: true, isScheme: true};
    const support = {isScheme: false, isSupport: true};

    assert.equal(await ability.canTrigger({
        player,
        effect: createThreatEffect(match, mainScheme),
    }), true);
    assert.equal(await ability.canTrigger({
        player,
        effect: createThreatEffect(match, support),
    }), false);
    assert.equal(await ability.canTrigger({
        player,
        effect: createThreatEffect(match, [sideScheme]),
    }), true);
    assert.equal(await ability.canTrigger({
        player,
        effect: createThreatEffect(match, [support]),
    }), false);
});

test('Protesto can be used once per round and resets at the round boundary', async () => {
    const {ability, match, player} = createProtesto();
    const scheme = {isMainScheme: true, isScheme: true};
    const firstEffect = createThreatEffect(match, scheme);

    assert.equal(await ability.canTrigger({
        player,
        effect: firstEffect,
    }), true);
    await ability.resolveAbility({
        player,
        effect: firstEffect,
    });

    assert.equal(ability.limit.used, 1);
    assert.equal(await ability.canTrigger({
        player,
        effect: createThreatEffect(match, scheme),
    }), false);

    new Effect({match}).endLimit(TARGET_ROUND);

    assert.equal(ability.limit.used, 0);
    assert.equal(await ability.canTrigger({
        player,
        effect: createThreatEffect(match, scheme),
    }), true);
});

test('Protesto keeps its round limit when the match is restored', async () => {
    const match = new Match({
        mc: {},
        name: 'protesto-limit-snapshot',
    });
    const player = {
        isAlterEgo: true,
        isPlayer: true,
    };
    const identity = createIdentity(match, player);
    const ability = identity.abilities.find(({name}) => name === '¡Protesto!');

    ability.limit.use();

    const restoredMatch = restoreMatch(serializeMatch(match), {});
    const restoredLimit = restoredMatch.limits[TARGET_ROUND][0];
    const restoredAbility = restoredLimit.ability;
    const restoredPlayer = restoredAbility.card.owner;

    assert.strictEqual(
        restoredAbility,
        restoredAbility.card.abilities.find(({name}) => name === '¡Protesto!')
    );
    assert.equal(restoredLimit.used, 1);
    assert.equal(await restoredAbility.canTrigger({
        player: restoredPlayer,
        effect: createThreatEffect(restoredMatch, {
            isMainScheme: true,
            isScheme: true,
        }),
    }), false);
});
