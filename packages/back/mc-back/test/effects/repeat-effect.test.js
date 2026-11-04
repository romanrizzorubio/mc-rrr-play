import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {EFFECT_DRAW_CARD, EFFECT_REPEAT, TARGET_YOU} from 'mc-shared';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {RepeatEffect} from '../../src/effects/repeat-effect.js';

describe('RepeatEffect', () => {
    test('resolves a real nested effect the configured number of times', async () => {
        const matchFactory = new MatchFactory({triggerCards: {}});
        const match = matchFactory.match;
        const drawCounts = [];
        const player = {
            isPlayer: true,
            deck: {
                async draw(count) {
                    drawCounts.push(count);
                    return [];
                },
            },
            hand: {
                addCards() {},
                async refresh() {},
            },
        };
        const effect = match.effectsFactory.parseEffect({
            type: EFFECT_REPEAT,
            params: {
                count: 2,
                effect: {
                    type: EFFECT_DRAW_CARD,
                    params: {target: TARGET_YOU, count: 1},
                },
            },
        });

        await effect.runEffect({match, player});

        assert.deepEqual(drawCounts, [1, 1]);
        assert.equal(effect.isResolved(), true);
        assert.equal(effect.isFullResolved(), true);
    });

    test('creates and resolves a fresh nested effect for each repetition', async () => {
        let nextInstance = 0;
        const resolvedInstances = [];
        const match = {
            effectsFactory: {
                parseEffect(definition) {
                    assert.deepEqual(definition, {type: 'test'});
                    const instance = ++nextInstance;
                    let resolved = false;

                    return {
                        async canRun() {
                            return true;
                        },
                        async runEffect() {
                            resolved = true;
                            resolvedInstances.push(instance);
                        },
                        isResolved() {
                            return resolved;
                        },
                        isFullResolved() {
                            return resolved;
                        },
                    };
                },
            },
        };
        const effect = new RepeatEffect({
            count: 2,
            effectDefinition: {type: 'test'},
            match,
        });

        assert.equal(await effect.canRun({}), true);
        await effect.execute({});

        assert.deepEqual(resolvedInstances, [2, 3]);
        assert.equal(effect.results.length, 2);
        assert.equal(effect.isResolved(), true);
        assert.equal(effect.isFullResolved(), true);
    });

    test('skips repetitions that no longer have a legal target', async () => {
        let nextInstance = 0;
        const resolvedInstances = [];
        const match = {
            effectsFactory: {
                parseEffect() {
                    const instance = ++nextInstance;
                    let resolved = false;

                    return {
                        async canRun() {
                            return instance !== 3;
                        },
                        async runEffect() {
                            resolved = true;
                            resolvedInstances.push(instance);
                        },
                        isResolved() {
                            return resolved;
                        },
                        isFullResolved() {
                            return resolved;
                        },
                    };
                },
            },
        };
        const effect = new RepeatEffect({
            count: 2,
            effectDefinition: {type: 'test'},
            match,
        });

        assert.equal(await effect.canRun({}), true);
        await effect.execute({});

        assert.deepEqual(resolvedInstances, [2]);
        assert.equal(effect.isResolved(), true);
        assert.equal(effect.isFullResolved(), false);
    });

    test('requires a positive repetition count and an effect definition', () => {
        assert.throws(() => new RepeatEffect({
            count: 0,
            effectDefinition: {type: 'test'},
            match: {},
        }), /positive integer count/);
        assert.throws(() => new RepeatEffect({
            count: 1,
            match: {},
        }), /effect definition/);
    });
});
