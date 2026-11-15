import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    TARGET_ENEMY,
    TRIGGER_YOU_DEALT_EXCESS_DAMAGE,
} from 'mc-shared';
import {Match} from '../../src/model/match/match.js';
import {serializeMatch} from '../../src/utils/match-serialization.js';
import {
    YouDealtExcessDamageTrigger,
} from '../../src/triggers/you-dealt-excess-damage-trigger.js';

describe('YouDealtExcessDamageTrigger', () => {
    test('resolves each eligible target independently', async() => {
        const player = {isPlayer: true};
        const minion = {id: 'minion', isMinion: true};
        const villain = {id: 'villain', isVillain: true};
        const card = {controller: player, owner: player};
        let resolvedParams;
        const ability = {
            canTrigger: async({triggeredTarget}) => triggeredTarget === villain,
            async resolveAbility(params) {
                resolvedParams = params;
                this.resolved = true;
            },
            resolved: false,
        };
        const trigger = new YouDealtExcessDamageTrigger({
            ability,
            card,
            target: TARGET_ENEMY,
            trigger: TRIGGER_YOU_DEALT_EXCESS_DAMAGE,
        });
        const effect = {
            ability: {card},
            excessDamage: [1, 1],
            excessDamageTargetWasEnemy: [true, true],
            selectedTarget: [minion, villain],
            takenDamage: [2, 2],
            triggerResolutionId: 1,
        };
        const params = {
            effect,
            match: {enemies: [minion, villain], players: [player]},
            player,
        };

        assert.equal(await trigger.canTrigger(params), true);
        assert.strictEqual(trigger.getTarget(params), villain);

        await trigger.runTrigger(params);

        assert.strictEqual(resolvedParams.triggeredTarget, villain);
        assert.equal(resolvedParams.triggeredTargetDamage, 2);
        assert.deepEqual(trigger.getTargetIndexes(params), [0]);
    });

    test('keeps target-index cache out of match snapshots', () => {
        const match = new Match({name: 'excess-damage-snapshot'});
        const trigger = new YouDealtExcessDamageTrigger({
            ability: {},
            card: {},
            trigger: TRIGGER_YOU_DEALT_EXCESS_DAMAGE,
        });
        const effect = {triggerResolutionId: 1};
        const indexes = trigger.getTriggeredTargetIndexes(effect);

        indexes.add(0);
        match.triggerCards.test = {triggers: {[TRIGGER_YOU_DEALT_EXCESS_DAMAGE]: {
            response: [trigger],
        }}};

        assert.strictEqual(trigger.getTriggeredTargetIndexes(effect), indexes);
        assert.doesNotThrow(() => serializeMatch(match));

        effect.triggerResolutionId = 2;
        assert.notStrictEqual(trigger.getTriggeredTargetIndexes(effect), indexes);
    });
});
