import assert from 'node:assert/strict';
import test from 'node:test';

import {PRIORITY_CONSTANT, TRIGGER_PLAYER_CAN_THAWRT} from 'mc-shared';
import {CannotEffect} from '../../src/effects/cannot-effect.js';
import {EnemyAttackEffect} from '../../src/effects/enemy-attack-effect.js';
import {Player} from '../../src/model/match/player.js';
import {Trigger} from '../../src/triggers/base/trigger.js';
import {HeroDefendsAttackTrigger} from '../../src/triggers/hero-defends-attack-trigger.js';

const createTriggerAbility = (card, effect) => ({
    card,
    async canTrigger(params) {
        return effect ? effect.canRun(params) : true;
    },
});

test('CannotEffect scopes its restriction to the player whose minions contain the source', async () => {
    const zemo = {};
    const effect = new CannotEffect({
        restriction: 'thwart',
        sourceIn: 'player.minions',
    });
    const ability = createTriggerAbility(zemo, effect);
    effect.ability = ability;
    const trigger = new Trigger({
        ability,
        card: zemo,
    });
    const restrictions = {thwart: true};
    const playerEngagedWithZemo = {minions: [zemo]};
    const otherPlayer = {minions: []};

    assert.equal(
        await trigger.canTrigger({
            restrictions,
            player: playerEngagedWithZemo,
        }),
        true
    );
    assert.equal(
        await trigger.canTrigger({
            restrictions,
            player: otherPlayer,
        }),
        false
    );
});

test('Player.canThwart exposes a parameterized restriction check', async () => {
    const unrestrictedPlayer = Object.create(Player.prototype);
    unrestrictedPlayer.trigger = async () => {};
    assert.equal(await unrestrictedPlayer.canThwart(), true);

    const zemo = {};
    const player = Object.create(Player.prototype);
    player.gameZone = {minions: [zemo]};
    let triggerParams;
    const effect = new CannotEffect({
        restriction: 'thwart',
        sourceIn: 'player.minions',
    });
    const ability = createTriggerAbility(zemo, effect);
    effect.ability = ability;
    const trigger = new Trigger({
        ability,
        card: zemo,
    });

    player.trigger = async (priority, triggers, params) => {
        assert.equal(priority, PRIORITY_CONSTANT);
        assert.deepEqual(triggers, [TRIGGER_PLAYER_CAN_THAWRT]);
        triggerParams = params;
        if (await trigger.canTrigger(params)) {
            effect.execute(params);
        }
    };

    assert.equal(await player.canThwart({source: 'basic thwart'}), false);
    assert.equal(triggerParams.player, player);
    assert.equal(triggerParams.source, 'basic thwart');
    assert.equal(triggerParams.effect, triggerParams.restrictions);
});

test('CannotEffect changes only its configured restriction', async () => {
    const player = {};
    const restrictions = {
        thwart: true,
        attack: true,
    };
    const effect = new CannotEffect({
        restriction: 'thwart',
    });

    test('CannotEffect validates its source collection path', () => {
        assert.throws(() => new CannotEffect({
            restriction: 'thwart',
            sourceIn: [],
        }), /sourceIn must be a non-empty path/);
    });
    const params = {
        player,
        restrictions,
    };

    assert.equal(await effect.canRun(params), true);
    effect.execute(params);

    assert.deepEqual(restrictions, {
        thwart: false,
        attack: true,
    });
});

test('Defensa hábil triggers only when its owner hero defends', async () => {
    const player = {};
    const trigger = new HeroDefendsAttackTrigger({
        ability: createTriggerAbility(),
        card: {owner: player},
    });

    assert.equal(
        await trigger.canTrigger({
            effect: {
                defender: {
                    isHero: true,
                    owner: player,
                },
            },
            player,
        }),
        true
    );
    assert.equal(
        await trigger.canTrigger({
            effect: {
                defender: {
                    isHero: false,
                    owner: player,
                },
            },
            player,
        }),
        undefined
    );
});

test('Defensa hábil modifies defense for the current attack', async () => {
    const attack = Object.create(EnemyAttackEffect.prototype);
    attack.modifyDefense = 3;
    const defender = {
        async getDefenseValue() {
            return 2;
        },
    };

    assert.equal(await attack.getDefenseValue({}, defender), 5);
});
