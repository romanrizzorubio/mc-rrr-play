import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    LABEL_DEFENSE,
    TRIGGER_ENEMY_ATTACKS_YOU,
    TRIGGER_HERO_DEFENDS_ATTACK,
} from 'mc-shared';
import {HeroInterruptAbility} from '../../src/abilities/interrupt/hero-interrupt-ability.js';
import {BoostAbility} from '../../src/abilities/misc/boost-ability.js';
import {Effect} from '../../src/effects/effect.js';
import {EnemyAttackEffect} from '../../src/effects/enemy-attack-effect.js';
import {AbilitiesFactory} from '../../src/factory/abilities/abilities-factory.js';
import protectionEvents from '../../../mc-data/seed/catalog/aspects/protection/events.js';

function createPlayer(id) {
    const player = {
        canAttack: () => true,
        canDefend: () => true,
        id,
        isHero: true,
        isPlayer: true,
    };
    const hero = {
        exhausted: false,
        id: `${id}-hero`,
        isHero: true,
        isSuperhero: false,
        name: `${id} Hero`,
        owner: player,
    };

    player.superhero = {
        currentSide: hero,
        isSuperhero: true,
        owner: player,
    };

    return player;
}

function createDefenseAbility(AbilityClass, player, match) {
    const card = {
        id: `defense-event-${player.id}`,
        isEvent: true,
        owner: player,
    };
    const effect = new Effect({match});
    effect.canRun = async () => true;
    effect.runEffect = async () => {
        effect.resolved = true;
    };

    return new AbilityClass({
        card,
        effect,
        labels: [LABEL_DEFENSE],
        match,
        trigger: TRIGGER_ENEMY_ATTACKS_YOU,
    });
}

function createAttack(match, target) {
    const attack = new EnemyAttackEffect({
        enemy: {isVillain: false, name: 'Minion'},
        match,
        selectedTarget: target,
    });
    attack.triggerTypes = [];
    attack.trigger = async (_priority, types) => {
        attack.triggerTypes.push(...types);

        return true;
    };

    return attack;
}

test('a triggered defense ability makes its hero the defender without exhausting them', async () => {
    const match = {triggerCards: {}};
    const player = createPlayer('player');
    const attack = createAttack(match, player);
    const ability = createDefenseAbility(HeroInterruptAbility, player, match);

    await ability.resolveAbility({
        arrowPaid: true,
        effect: attack,
        player,
        triggeredEffect: attack,
    });

    assert.equal(attack.isDefended, true);
    assert.equal(attack.defender, player.superhero.currentSide);
    assert.equal(player.superhero.currentSide.exhausted, false);
    assert.ok(attack.triggerTypes.includes(TRIGGER_HERO_DEFENDS_ATTACK));
});

test('the defense ability defender remains the only defender in the defense step', async () => {
    const match = {triggerCards: {}};
    const player = createPlayer('player');
    const ally = {id: 'ally', owner: player};
    player.defenders = [player.superhero, ally];
    const attack = createAttack(match, player);
    const ability = createDefenseAbility(HeroInterruptAbility, player, match);

    await ability.resolveAbility({
        arrowPaid: true,
        effect: attack,
        player,
        triggeredEffect: attack,
    });

    assert.deepEqual(attack.getDefenders(player), [player.superhero]);
});

test('a defense event during boost resolution uses the underlying enemy attack', async () => {
    const match = {triggerCards: {}};
    const player = createPlayer('player');
    const attack = createAttack(match, player);
    const boostResolution = {enemyActivation: attack};
    const ability = createDefenseAbility(HeroInterruptAbility, player, match);

    await ability.resolveAbility({
        arrowPaid: true,
        effect: boostResolution,
        player,
        triggeredEffect: boostResolution,
    });

    assert.equal(attack.isDefended, true);
    assert.equal(attack.defender, player.superhero.currentSide);
});

test('a defense ability used after the attack does not make it defended', async () => {
    const match = {triggerCards: {}};
    const player = createPlayer('player');
    const attack = createAttack(match, player);
    attack.resolved = true;
    const ability = createDefenseAbility(HeroInterruptAbility, player, match);

    assert.equal(await ability.canRun({
        effect: attack,
        player,
    }), true);

    await ability.resolveAbility({
        arrowPaid: true,
        effect: attack,
        player,
        triggeredEffect: attack,
    });

    assert.equal(attack.isDefended, false);
});

test('a boost ability labeled defense does not make its player the defender', async () => {
    const match = {triggerCards: {}};
    const player = createPlayer('player');
    const attack = createAttack(match, player);
    const ability = createDefenseAbility(BoostAbility, player, match);

    await ability.resolveAbility({
        arrowPaid: true,
        effect: attack,
        player,
        triggeredEffect: attack,
    });

    assert.equal(attack.isDefended, false);
});

test('a defense ability cannot replace another player as defender', async () => {
    const match = {triggerCards: {}};
    const defendingPlayer = createPlayer('defender');
    const otherPlayer = createPlayer('other');
    const attack = createAttack(match, defendingPlayer);
    attack.defender = defendingPlayer.superhero.currentSide;
    attack.defendersByTarget.set(defendingPlayer, attack.defender);
    const ability = createDefenseAbility(HeroInterruptAbility, otherPlayer, match);

    assert.equal(await ability.canRun({
        effect: attack,
        player: otherPlayer,
    }), false);
});

test('a defense ability does not replace its controller ally who is defending', async () => {
    const match = {triggerCards: {}};
    const player = createPlayer('player');
    const ally = {id: 'ally', isAlly: true, owner: player};
    const attack = createAttack(match, player);
    attack.defender = ally;
    attack.defendersByTarget.set(player, ally);
    const ability = createDefenseAbility(HeroInterruptAbility, player, match);

    await ability.resolveAbility({
        arrowPaid: true,
        effect: attack,
        player,
        triggeredEffect: attack,
    });

    assert.equal(attack.defender, ally);
});

test('Contragolpe can respond after its hero defends against any enemy attack', async () => {
    const match = {triggerCards: {}};
    const player = createPlayer('player');
    const attack = createAttack(match, player);
    const counterPunch = protectionEvents.find(({_id}) =>
        _id === 'protection-contragolpe').card.params.abilities[0];
    const response = new AbilitiesFactory({match}).createAbility(counterPunch);
    response.card = {
        id: 'counter-punch',
        isEvent: true,
        owner: player,
    };
    response.effect.canRun = async () => true;

    assert.equal(await response.canRun({
        arrowPaid: true,
        effect: attack,
        player,
    }), false);

    const defenseAbility = createDefenseAbility(
        HeroInterruptAbility,
        player,
        match
    );

    await defenseAbility.resolveAbility({
        arrowPaid: true,
        effect: attack,
        player,
        triggeredEffect: attack,
    });

    assert.equal(response.trigger, TRIGGER_ENEMY_ATTACKS_YOU);
    assert.equal(await response.canRun({
        arrowPaid: true,
        effect: attack,
        player,
    }), true);
});
