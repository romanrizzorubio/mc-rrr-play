import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    PRIORITY_FORCED_INTERRUPT,
    TRIGGER_ENEMY_ATTACKS_YOU,
} from 'mc-shared';
import {DealDamageEffect} from '../../src/effects/deal-damage-effect.js';
import {EnemyAttackEffect} from '../../src/effects/enemy-attack-effect.js';

async function runAttackAfterInterrupt(effect, interrupt) {
    effect.canRun = async () => true;
    effect.prepare = async () => {};
    effect.getTriggersParams = params => params;
    effect.triggerWould = async () => true;
    effect.triggerInit = async () => {
        await interrupt();

        return true;
    };

    await effect.runEffect({});
}

test('a minion defeated during the attack interrupt does not resolve its activation', async () => {
    const minion = {
        isInPlay: true,
        isMinion: true,
        name: 'Esbirro',
    };
    const effect = new EnemyAttackEffect({
        enemy: minion,
        match: {},
    });
    let attackResolved = false;
    let attackEnded = false;
    effect.execute = async () => {
        attackResolved = true;
    };
    effect.triggerEnds = async () => {
        attackEnded = true;
    };

    await runAttackAfterInterrupt(effect, async () => {
        minion.isInPlay = false;
    });

    assert.equal(attackResolved, false);
    assert.equal(attackEnded, false);
    assert.equal(effect.resolved, false);
});

test('enemy attack interrupt processing stops after an automatic interrupt defeats its attacker', async () => {
    const minion = {
        isInPlay: true,
        isMinion: true,
        name: 'Esbirro',
    };
    const player = {
        hand: {cards: []},
    };
    const match = {
        triggerCards: {},
    };
    const effect = new EnemyAttackEffect({
        enemy: minion,
        match,
    });
    let laterInterruptResolved = false;
    const card = {
        id: 'interrupts',
        owner: player,
        triggers: {},
    };
    const defeatAttacker = {
        ability: {
            hideDialog: true,
            isOptionAbility: false,
        },
        card,
        async canTrigger() {
            return true;
        },
        async runTrigger() {
            minion.isInPlay = false;
            this.paymentCancelled = false;
        },
    };
    const laterInterrupt = {
        ability: {
            hideDialog: true,
            isOptionAbility: false,
        },
        card,
        async canTrigger() {
            return true;
        },
        async runTrigger() {
            laterInterruptResolved = true;
            this.paymentCancelled = false;
        },
    };
    card.triggers[TRIGGER_ENEMY_ATTACKS_YOU] = {
        [PRIORITY_FORCED_INTERRUPT]: [defeatAttacker, laterInterrupt],
    };
    match.triggerCards[card.id] = card;

    const triggered = await effect.trigger(
        PRIORITY_FORCED_INTERRUPT,
        [TRIGGER_ENEMY_ATTACKS_YOU],
        {effect, match, player}
    );

    assert.equal(triggered, false);
    assert.equal(laterInterruptResolved, false);
    assert.equal(effect.activationInterrupted, true);
});

test('attack damage interrupts stop when their parent enemy activation ends', async () => {
    const minion = {
        isInPlay: true,
        isMinion: true,
    };
    const player = {
        hand: {cards: []},
    };
    const match = {
        triggerCards: {},
    };
    const attack = new EnemyAttackEffect({
        enemy: minion,
        match,
    });
    const card = {
        id: 'damage-interrupts',
        owner: player,
        triggers: {},
    };
    let laterInterruptResolved = false;
    const defeatAttacker = {
        ability: {
            hideDialog: true,
            isOptionAbility: false,
        },
        card,
        async canTrigger() {
            return true;
        },
        async runTrigger() {
            minion.isInPlay = false;
            this.paymentCancelled = false;
        },
    };
    const laterInterrupt = {
        ability: {
            hideDialog: true,
            isOptionAbility: false,
        },
        card,
        async canTrigger() {
            return true;
        },
        async runTrigger() {
            laterInterruptResolved = true;
            this.paymentCancelled = false;
        },
    };
    card.triggers[TRIGGER_ENEMY_ATTACKS_YOU] = {
        [PRIORITY_FORCED_INTERRUPT]: [defeatAttacker, laterInterrupt],
    };
    match.triggerCards[card.id] = card;
    const damageEffect = new DealDamageEffect({
        activation: {effect: attack},
        character: {},
        damage: 1,
        match,
    });
    damageEffect.damage = 1;

    const triggered = await damageEffect.trigger(
        PRIORITY_FORCED_INTERRUPT,
        [TRIGGER_ENEMY_ATTACKS_YOU],
        {effect: damageEffect, match, player}
    );

    assert.equal(triggered, false);
    assert.equal(laterInterruptResolved, false);
    assert.equal(attack.activationInterrupted, true);
});

test('an attack continues with the next same-title villain stage', async () => {
    const firstStage = {
        isInPlay: true,
        isVillain: true,
        name: 'Rino',
    };
    const nextStage = {
        isInPlay: true,
        isVillain: true,
        name: 'Rino',
    };
    const match = {villain: firstStage};
    const effect = new EnemyAttackEffect({
        enemy: firstStage,
        match,
    });
    let resolvedWith;
    let attackEnded = false;
    effect.execute = async () => {
        resolvedWith = effect.character;
    };
    effect.triggerEnds = async () => {
        attackEnded = true;
    };

    await runAttackAfterInterrupt(effect, async () => {
        firstStage.isInPlay = false;
        match.villain = nextStage;
    });

    assert.equal(resolvedWith, nextStage);
    assert.equal(attackEnded, true);
    assert.equal(effect.resolved, true);
});

test('an attack ends when the villain advances to a different-title stage', async () => {
    const firstStage = {
        isInPlay: true,
        isVillain: true,
        name: 'Rino',
    };
    const nextVillain = {
        isInPlay: true,
        isVillain: true,
        name: 'Klaw',
    };
    const match = {villain: firstStage};
    const effect = new EnemyAttackEffect({
        enemy: firstStage,
        match,
    });
    let attackResolved = false;
    let attackEnded = false;
    effect.execute = async () => {
        attackResolved = true;
    };
    effect.triggerEnds = async () => {
        attackEnded = true;
    };

    await runAttackAfterInterrupt(effect, async () => {
        firstStage.isInPlay = false;
        match.villain = nextVillain;
    });

    assert.equal(attackResolved, false);
    assert.equal(attackEnded, false);
    assert.equal(effect.resolved, false);
});

test('a final villain defeat stops its attack even while the defeated stage remains referenced', async () => {
    const villain = {
        isInPlay: true,
        isVillain: true,
        name: 'Rino',
    };
    const match = {villain};
    const effect = new EnemyAttackEffect({
        enemy: villain,
        match,
    });
    let attackResolved = false;
    let attackEnded = false;
    effect.execute = async () => {
        attackResolved = true;
    };
    effect.triggerEnds = async () => {
        attackEnded = true;
    };

    await runAttackAfterInterrupt(effect, async () => {
        match.gameOverReason = 'villain-defeated';
    });

    assert.equal(attackResolved, false);
    assert.equal(attackEnded, false);
    assert.equal(effect.resolved, false);
});

test('an enemy defeated during boost resolution stops the remaining attack steps', async () => {
    const minion = {
        isInPlay: true,
        isMinion: true,
    };
    const effect = new EnemyAttackEffect({
        enemy: minion,
        match: {},
    });
    let showedBoostCards = false;
    effect.dealBoostCards = async () => {
        minion.isInPlay = false;
    };
    effect.showBoostCards = async () => {
        showedBoostCards = true;
    };

    await effect.execute({});

    assert.equal(showedBoostCards, false);
    assert.equal(effect.activationInterrupted, true);
});
