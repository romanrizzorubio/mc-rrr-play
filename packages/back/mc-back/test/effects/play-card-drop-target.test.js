import assert from 'node:assert/strict';
import {test} from 'node:test';

import {TARGET_ENEMY, TARGET_SCHEME, TARGET_VILLAIN} from 'mc-shared';
import {Ability} from '../../src/abilities/core/ability.js';
import {ChainedEffect} from '../../src/effects/chained-effect.js';
import {ConfuseEffect} from '../../src/effects/confuse-effect.js';
import {DealDamageEffect} from '../../src/effects/deal-damage-effect.js';
import {PlayCardEffect} from '../../src/effects/play-card-effect.js';
import {RemoveThreatEffect} from '../../src/effects/remove-threat-effect.js';
import {ResourceCost} from '../../src/model/costs/resource-cost.js';

async function prepareDraggedDamageEvent({nested}) {
    const target = {abilities: [], id: 'enemy-2'};
    const otherEnemy = {abilities: [], id: 'enemy-1'};
    const match = {
        enemies: [otherEnemy, target],
        openDialog() {
            throw new Error('A legal dropped target should not open a dialog.');
        },
        triggerCards: {},
    };
    const damageEffect = new DealDamageEffect({
        damage: 2,
        match,
        refreshTarget: true,
        target: TARGET_ENEMY,
    });
    const effect = nested ?
        new ChainedEffect({
            effects: [damageEffect],
            match,
        }) :
        damageEffect;
    const ability = new Ability({
        effect,
        match,
        name: 'Damage event',
    });
    ability.canRun = async () => true;

    const card = {
        abilities: [ability],
        isEvent: true,
        isUpgrade: false,
        isPlaying: false,
    };
    const player = {
        deck: {
            async discard() {},
        },
        hand: {
            cards: [card],
            async discardHand(discardedCard) {
                this.cards.splice(this.cards.indexOf(discardedCard), 1);
            },
            async refresh() {},
        },
    };
    const playCardEffect = new PlayCardEffect({
        card,
        match,
        targetId: target.id,
    });

    await playCardEffect.prepare({
        card,
        match,
        player,
    });
    let targetAtResolution;
    effect.runEffect = async function (params) {
        assert.equal(params.preselectedEffectTargets.has(damageEffect), true);
        targetAtResolution = damageEffect.selectedTarget;
        this.resolved = true;
    };
    playCardEffect.getResourceCost = async () => {
        assert.strictEqual(damageEffect.selectedTarget, target);

        return new ResourceCost({
            amount: 0,
            card,
            match,
            playCardEffect,
        });
    };
    let abilityState;
    const prepareToResolve = ability.prepareToResolve.bind(ability);
    ability.prepareToResolve = async params => {
        assert.equal(params.preselectedTarget, true);
        abilityState = await prepareToResolve(params);

        return abilityState;
    };

    await playCardEffect.execute({
        card,
        match,
        player,
    });

    return {
        abilityState,
        damageEffect,
        playCardEffect,
        target,
        targetAtResolution,
    };
}

for (const nested of [false, true]) {
    test(
        `dragged target is preserved for ${nested ? 'nested' : 'direct'} damage events`,
        async () => {
            const {
                abilityState,
                damageEffect,
                playCardEffect,
                target,
                targetAtResolution,
            } = await prepareDraggedDamageEvent({nested});

            assert.equal(playCardEffect.hasPreselectedEventTarget, true);
            assert.equal(abilityState.canRun, true);
            assert.strictEqual(damageEffect.selectedTarget, target);
            assert.strictEqual(targetAtResolution, target);
        }
    );
}

test('dragging an event onto a scheme preselects its nested thwart target', async () => {
    const scheme = {
        abilities: [],
        canRemoveThreat: () => true,
        id: 'scheme-2',
    };
    const otherScheme = {
        abilities: [],
        canRemoveThreat: () => true,
        id: 'scheme-1',
    };
    const villain = {
        abilities: [],
        confuse() {
            this.isConfused = true;
        },
        id: 'villain-1',
        isConfused: false,
        refresh() {},
    };
    const match = {
        enemies: [villain],
        openDialog() {
            throw new Error('A legal dropped target should not open a dialog.');
        },
        schemes: [otherScheme, scheme],
        triggerCards: {},
        villain,
    };
    const removeThreat = new RemoveThreatEffect({
        match,
        refreshTarget: true,
        target: TARGET_SCHEME,
        threat: 4,
    });
    const confuse = new ConfuseEffect({
        match,
        refreshTarget: true,
        target: TARGET_VILLAIN,
    });
    const effect = new ChainedEffect({
        effects: [removeThreat, confuse],
        match,
        refreshTarget: true,
    });
    const ability = new Ability({effect, match});
    ability.canRun = async () => true;
    const card = {
        abilities: [ability],
        isEvent: true,
        isUpgrade: false,
        isPlaying: false,
    };
    const player = {
        deck: {
            async discard() {},
        },
        hand: {
            cards: [card],
            async discardHand(discardedCard) {
                this.cards.splice(this.cards.indexOf(discardedCard), 1);
            },
            async refresh() {},
        },
    };
    const playCardEffect = new PlayCardEffect({
        card,
        match,
        targetId: scheme.id,
    });

    await playCardEffect.prepare({card, match, player});

    let targetAtResolution;
    removeThreat.execute = async function () {
        targetAtResolution = removeThreat.selectedTarget;
    };
    playCardEffect.getResourceCost = async () => new ResourceCost({
        amount: 0,
        card,
        match,
        playCardEffect,
    });

    await playCardEffect.execute({card, match, player});

    assert.equal(playCardEffect.hasPreselectedEventTarget, true);
    assert.strictEqual(removeThreat.selectedTarget, scheme);
    assert.strictEqual(targetAtResolution, scheme);
    assert.strictEqual(confuse.selectedTarget, villain);
    assert.equal(villain.isConfused, true);
});

test('rejects a dragged event target that is no longer legal', async () => {
    const target = {abilities: [], id: 'villain-1'};
    const match = {enemies: [target]};
    const card = {
        abilities: [{
            effect: new DealDamageEffect({
                damage: 2,
                match,
                refreshTarget: true,
                target: TARGET_ENEMY,
            }),
        }],
        isEvent: true,
    };
    const playCardEffect = new PlayCardEffect({
        card,
        match,
        targetId: 'stale-target',
    });

    await assert.rejects(
        playCardEffect.preselectDroppedTarget({
            card,
            match,
            player: {},
        }),
        /El objetivo seleccionado para jugar la carta ya no es válido/
    );
});
