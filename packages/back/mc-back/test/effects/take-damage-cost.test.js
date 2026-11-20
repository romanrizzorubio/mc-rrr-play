import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    DIALOG_LIST,
    DIALOG_USE_CARD,
    EFFECT_PLACE_DAMAGE,
    PRIORITY_FORCED_INTERRUPT,
    PRIORITY_INTERRUPT,
    TRIGGER_CHARACTER_WOULD_TAKE_DAMAGE,
} from 'mc-shared';
import {TakeDamageEffect} from '../../src/effects/take-damage-effect.js';
import {Trigger} from '../../src/triggers/base/trigger.js';
import {CostPaymentSession} from '../../src/utils/cost-payment-session.js';

describe('damage costs', () => {
    function createPlayer() {
        return {
            hand: {cards: []},
            id: 'player-1',
            isPlayer: true,
            name: 'Jugador',
        };
    }

    function createTarget({isTough = false} = {}) {
        return {
            damage: 0,
            isTough,
            async getLife() {
                return 10 - this.damage;
            },
            removeTough() {
                this.isTough = false;
            },
            async refresh() {},
        };
    }

    function createMatch(dialogs) {
        return {
            effectsFactory: {
                createEffect({damage, selectedTarget, type}) {
                    assert.equal(type, EFFECT_PLACE_DAMAGE);

                    return {
                        async runEffect() {
                            selectedTarget.damage += damage;
                        },
                    };
                },
            },
            openDialog: async dialog => {
                dialogs.push(dialog);

                return {selected: dialog.data?.options?.[0]};
            },
            triggerCards: {},
        };
    }

    function addDamageInterrupt(match, player, {
        id,
        priority,
        hideDialog = false,
        resolve,
    }) {
        const ability = {
            effect: {
                isChoose: false,
                isChooseAbility: false,
            },
            hideDialog,
            id: `${id}-ability`,
            name: 'Evitar daño',
            async canTrigger() {
                return true;
            },
            async resolveAbility(params) {
                await resolve?.(params.triggeredEffect);
                this.resolved = true;
            },
            getTitle() {
                return this.name;
            },
        };
        const card = {
            id,
            owner: player,
            toObj() {
                return {id: this.id};
            },
            triggers: {},
        };
        const trigger = new Trigger({
            ability,
            card,
            trigger: TRIGGER_CHARACTER_WOULD_TAKE_DAMAGE,
        });
        card.triggers[TRIGGER_CHARACTER_WOULD_TAKE_DAMAGE] = {
            [priority]: [trigger],
        };
        match.triggerCards[id] = card;

        return trigger;
    }

    test('cost damage skips optional interrupts while ordinary damage still offers them', async () => {
        const player = createPlayer();
        const costDialogs = [];
        const costMatch = createMatch(costDialogs);
        const costTarget = createTarget();
        addDamageInterrupt(costMatch, player, {
            id: 'optional-cost-interrupt',
            priority: PRIORITY_INTERRUPT,
        });
        const costEffect = new TakeDamageEffect({
            damage: 2,
            isCost: true,
            match: costMatch,
            selectedTarget: costTarget,
        });

        const costResult = await new CostPaymentSession().resolve(
            costEffect,
            {
                match: costMatch,
                player,
                preselectedEffectTargets: new Set([costEffect]),
            },
            {requireAllCosts: true}
        );

        assert.equal(costResult.resolved, true);
        assert.equal(costTarget.damage, 2);
        assert.equal(costDialogs.length, 0);

        const regularDialogs = [];
        const regularMatch = createMatch(regularDialogs);
        const regularTarget = createTarget();
        addDamageInterrupt(regularMatch, player, {
            id: 'optional-regular-interrupt',
            priority: PRIORITY_INTERRUPT,
        });
        const regularEffect = new TakeDamageEffect({
            damage: 2,
            match: regularMatch,
            selectedTarget: regularTarget,
        });

        assert.equal(await regularEffect.triggerWould({
            costPaymentSession: {requireAllCosts: true},
            match: regularMatch,
            player,
            triggeredEffect: {},
        }), true);
        assert.equal(regularDialogs.length, 1);
        assert.equal(regularDialogs[0].dialogType, DIALOG_USE_CARD);
    });

    test('an eligible forced interrupt is not offered or executed and blocks payment', async () => {
        const player = createPlayer();
        const dialogs = [];
        const match = createMatch(dialogs);
        const target = createTarget();
        let forcedInterruptExecutions = 0;
        addDamageInterrupt(match, player, {
            id: 'forced-cost-interrupt',
            priority: PRIORITY_FORCED_INTERRUPT,
            resolve(effect) {
                forcedInterruptExecutions++;
                effect.preventDamage = effect.damage;
            },
        });
        const effect = new TakeDamageEffect({
            damage: 2,
            isCost: true,
            match,
            selectedTarget: target,
        });

        const result = await new CostPaymentSession().resolve(
            effect,
            {
                match,
                player,
                preselectedEffectTargets: new Set([effect]),
            },
            {requireAllCosts: true}
        );

        assert.deepEqual(result, {
            blocked: true,
            cancelled: false,
            resolved: false,
        });
        assert.equal(target.damage, 0);
        assert.equal(forcedInterruptExecutions, 0);
        assert.equal(effect.preventDamage, 0);
        assert.equal(dialogs.length, 1);
        assert.equal(dialogs[0].dialogType, DIALOG_LIST);
        assert.equal(dialogs[0].targetPlayer, player);
        assert.match(dialogs[0].subtitle, /interrupción obligada/);
        assert.match(dialogs[0].subtitle, /no puedes pagar este coste/i);
    });

    test('Tough blocks a damage cost without being removed and explains why payment failed', async () => {
        const player = createPlayer();
        const dialogs = [];
        const match = createMatch(dialogs);
        const target = createTarget({isTough: true});
        const effect = new TakeDamageEffect({
            damage: 2,
            isCost: true,
            match,
            selectedTarget: target,
        });

        const result = await new CostPaymentSession().resolve(
            effect,
            {
                match,
                player,
                preselectedEffectTargets: new Set([effect]),
            },
            {requireAllCosts: true}
        );

        assert.equal(result.blocked, true);
        assert.equal(target.damage, 0);
        assert.equal(target.isTough, true);
        assert.equal(dialogs.length, 1);
        assert.equal(dialogs[0].dialogType, DIALOG_LIST);
        assert.match(dialogs[0].subtitle, /estado Duro/);
    });

    test('a forced interrupt that could partially prevent damage is also not executed', async () => {
        const player = createPlayer();
        const dialogs = [];
        const match = createMatch(dialogs);
        const target = createTarget();
        let forcedInterruptExecutions = 0;
        addDamageInterrupt(match, player, {
            id: 'partial-forced-cost-interrupt',
            priority: PRIORITY_FORCED_INTERRUPT,
            resolve(effect) {
                forcedInterruptExecutions++;
                effect.preventDamage = 1;
            },
        });
        const effect = new TakeDamageEffect({
            damage: 2,
            isCost: true,
            match,
            selectedTarget: target,
        });

        const result = await new CostPaymentSession().resolve(
            effect,
            {
                match,
                player,
                preselectedEffectTargets: new Set([effect]),
            },
            {requireAllCosts: true}
        );

        assert.equal(result.blocked, true);
        assert.equal(target.damage, 0);
        assert.equal(forcedInterruptExecutions, 0);
        assert.equal(effect.preventDamage, 0);
        assert.equal(dialogs.length, 1);
        assert.match(dialogs[0].subtitle, /interrupción obligada/);
    });
});
