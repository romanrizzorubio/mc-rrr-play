import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    CALC_COUNT,
    EFFECT_PREVENT_DAMAGE,
    EFFECT_PREVENT_PLACE_DAMAGE,
    TARGET_CARD,
    TARGET_EFFECT,
} from 'mc-shared';
import {Match} from '../../src/model/match/match.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {TakeDamageEffect} from '../../src/effects/take-damage-effect.js';
import {DealDamageEffect} from '../../src/effects/deal-damage-effect.js';
import {CharacterWouldTakeDamageTrigger} from '../../src/triggers/character-would-take-damage-trigger.js';

describe('explicit damage prevention', () => {
    const createContext = ({pendingAttack = false, multiple = false, cards = []} = {}) => {
        const match = new Match({name: 'prevention-test', mc: {mcSocket: {send() {}}}});
        new MatchFactory(match);
        const target = {
            id: 'damaged-character',
            name: 'Personaje',
            match,
            damage: 0,
            placeDamage(damage) {this.damage += damage;},
            async refresh() {},
        };
        const other = {...target, id: 'other-character', name: 'Otro personaje'};
        const EffectClass = pendingAttack ? DealDamageEffect : TakeDamageEffect;
        const incoming = new EffectClass({
            match,
            damage: multiple ? [3, 5] : 5,
            selectedTarget: multiple ? [other, target] : target,
            isAttack: pendingAttack,
        });
        const trigger = new CharacterWouldTakeDamageTrigger({card: target, target: TARGET_CARD});
        const params = trigger.getAbilityParams(incoming.getTriggersParams({
            match,
            player: {},
            card: target,
            cards,
        }));

        return {match, incoming, params, target};
    };

    for (const pendingAttack of [false, true]) {
        for (const multiple of [false, true]) {
            for (const calculated of [false, true]) {
                test(`zero ${calculated ? 'calculated' : 'fixed'} prevention leaves ${multiple ? 'multiple targets' : 'one target'} unchanged in ${pendingAttack ? 'an attack' : 'damage'}`, async () => {
                    const {match, incoming, params} = createContext({pendingAttack, multiple});
                    const effect = match.effectsFactory.createEffect({
                        type: EFFECT_PREVENT_DAMAGE,
                        params: {
                            target: TARGET_EFFECT,
                            ...(calculated ?
                                {paramsCalc: {target: 'cards', formula: CALC_COUNT}} :
                                {damage: 0}),
                        },
                    });
                    assert.equal(effect.preventAll, false);
                    assert.equal(await effect.canRun(params), false);

                    await effect.runEffect(params);

                    assert.deepEqual(incoming.takenDamage, pendingAttack ? 0 : multiple ? [3, 5] : 5);
                    assert.deepEqual(incoming.preventDamage, multiple ? [0, 0] : 0);
                });
            }
        }
    }

    test('a positive calculation avoids only the calculated amount', async () => {
        const {match, incoming, params} = createContext({cards: [{}, {}]});
        const effect = match.effectsFactory.createEffect({
            type: EFFECT_PREVENT_DAMAGE,
            params: {
                target: TARGET_EFFECT,
                paramsCalc: {target: 'cards', formula: CALC_COUNT},
            },
        });
        assert.equal(await effect.canRun(params), true);

        await effect.runEffect(params);

        assert.equal(incoming.preventDamage, 2);
        assert.equal(incoming.takenDamage, 3);
    });

    test('an explicit total-prevention flag avoids all incoming damage', async () => {
        const {match, incoming, params} = createContext();
        const effect = match.effectsFactory.createEffect({
            type: EFFECT_PREVENT_DAMAGE,
            params: {target: TARGET_EFFECT, preventAll: true},
        });

        await effect.runEffect(params);

        assert.equal(incoming.preventDamage, 5);
        assert.equal(incoming.takenDamage, 0);
    });

    test('a last-step amount of zero remains zero even with a positive configured amount', async () => {
        const {match, incoming, params} = createContext();
        const effect = match.effectsFactory.createEffect({
            type: EFFECT_PREVENT_DAMAGE,
            params: {
                target: TARGET_EFFECT,
                damage: 3,
                paramsLastStep: {damage: 0},
            },
        });

        await effect.runEffect({...params, isLastStep: true});

        assert.equal(incoming.preventDamage, 0);
        assert.equal(incoming.takenDamage, 5);
    });

    for (const count of [0, 2]) {
        test(`prevention placed on a source uses exactly ${count} calculated damage`, async () => {
            const {match, incoming, params, target} = createContext({
                cards: Array.from({length: count}, () => ({})),
            });
            const effect = match.effectsFactory.createEffect({
                type: EFFECT_PREVENT_PLACE_DAMAGE,
                params: {
                    selectedTarget: target,
                    paramsCalc: {target: 'cards', formula: CALC_COUNT},
                },
            });

            await effect.runEffect({...params, damage: 99});

            assert.equal(incoming.preventDamage, count);
            assert.equal(incoming.takenDamage, 5 - count);
            assert.equal(target.damage, count);
        });
    }

    test('confirmation uses the same positive calculation and rejects a zero preview', async () => {
        const {match, params, target} = createContext({cards: [{}, {}]});
        let preview;
        match.openDialog = async dialog => {
            preview = dialog.data.preventedDamage;
            return {confirmed: true};
        };
        const effect = match.effectsFactory.createEffect({
            type: EFFECT_PREVENT_DAMAGE,
            params: {
                target: TARGET_EFFECT,
                requiresPrePlayConfirmation: true,
                paramsCalc: {target: 'cards', formula: CALC_COUNT},
            },
        });
        effect.ability = {card: {name: 'Prevención', toObj: () => ({name: 'Prevención'})}};
        assert.equal(await effect.confirmBeforeResolve({
            ...params,
            triggeredTargetCharacter: target,
        }), true);
        assert.equal(preview, 2);

        await assert.rejects(effect.confirmBeforeResolve({...params, cards: []}),
            /positive integer damage amount/);
    });
});
