import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    TARGET_ALL_ALLIES,
    TARGET_ALL_ALLIES_YOU_CONTROL,
    TARGET_ALL_CHARACTERS_YOU_CONTROL,
    TARGET_ALL_FRIENDLY_CHARACTERS,
    TARGET_ALLY,
} from 'mc-shared';
import {Match} from '../../src/model/match/match.js';
import {ValidTarget} from '../../src/targets/valid-target.js';
import {groupTargets} from '../../src/targets/groups.js';
import {playerControlledTargets} from '../../src/targets/player-controlled.js';

test('TARGET_ALL_FRIENDLY_CHARACTERS includes heroes, alter egos and allies for every player', async () => {
    const hero = {id: 'hero'};
    const ally = {id: 'ally'};
    const alterEgo = {id: 'alter-ego'};
    const otherAlly = {id: 'other-ally'};
    const match = Object.create(Match.prototype);
    match.players = [
        {friends: [hero, ally]},
        {friends: [alterEgo, otherAlly]},
    ];
    const characters = [hero, ally, alterEgo, otherAlly];
    const validTarget = new ValidTarget({match});

    assert.deepEqual(
        groupTargets[TARGET_ALL_FRIENDLY_CHARACTERS]({match}),
        characters
    );
    assert.deepEqual(
        await validTarget.selectTarget({
            target: TARGET_ALL_FRIENDLY_CHARACTERS,
            player: match.players[0],
        }),
        characters
    );
    assert.equal(
        validTarget.isMultipleTarget({target: TARGET_ALL_FRIENDLY_CHARACTERS}),
        true
    );
});

test('TARGET_ALL_ALLIES selects allies controlled by every player', async () => {
    const allies = [{id: 'ally-1'}, {id: 'ally-2'}];
    const otherPlayerAllies = [{id: 'other-player-ally'}];
    const player = {allies};
    const otherPlayer = {allies: otherPlayerAllies};
    const match = {players: [player, otherPlayer]};
    const validTarget = new ValidTarget({
        match,
    });

    assert.deepEqual(
        groupTargets[TARGET_ALL_ALLIES]({match}),
        [...allies, ...otherPlayerAllies]
    );
    assert.deepEqual(
        await validTarget.selectTarget({target: TARGET_ALL_ALLIES, player}),
        [...allies, ...otherPlayerAllies]
    );
    assert.equal(validTarget.isMultipleTarget({target: TARGET_ALL_ALLIES}), true);
});

test('TARGET_ALL_ALLIES_YOU_CONTROL selects only allies controlled by the current player', async () => {
    const allies = [{id: 'ally-1'}, {id: 'ally-2'}];
    const player = {allies};
    const otherPlayer = {allies: [{id: 'other-player-ally'}]};
    const validTarget = new ValidTarget({
        match: {players: [player, otherPlayer]},
    });

    assert.deepEqual(
        playerControlledTargets[TARGET_ALL_ALLIES_YOU_CONTROL]({player}),
        allies
    );
    assert.deepEqual(
        await validTarget.selectTarget({
            target: TARGET_ALL_ALLIES_YOU_CONTROL,
            player,
        }),
        allies
    );
    assert.equal(
        validTarget.isMultipleTarget({target: TARGET_ALL_ALLIES_YOU_CONTROL}),
        true
    );
    assert.equal(validTarget.isMultipleTarget({target: TARGET_ALLY}), false);
});

test('TARGET_ALL_CHARACTERS_YOU_CONTROL selects the current player hero and allies', async () => {
    const hero = {id: 'hero'};
    const ally = {id: 'ally'};
    const player = {
        friends: [ally, hero],
    };
    const validTarget = new ValidTarget({
        match: {},
    });

    assert.deepEqual(
        playerControlledTargets[TARGET_ALL_CHARACTERS_YOU_CONTROL]({player}),
        [ally, hero]
    );
    assert.deepEqual(
        await validTarget.selectTarget({
            target: TARGET_ALL_CHARACTERS_YOU_CONTROL,
            player,
        }),
        [ally, hero]
    );
    assert.equal(
        validTarget.isMultipleTarget({target: TARGET_ALL_CHARACTERS_YOU_CONTROL}),
        true
    );
});
