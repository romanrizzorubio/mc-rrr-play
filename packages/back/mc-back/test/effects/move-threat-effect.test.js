import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    EFFECT_DEFEAT,
    EFFECT_MOVE_THREAT,
    PRIORITY_RESPONSE,
    TARGET_SCHEME,
    TARGET_THIS,
    TRIGGER_MOVE_THREAT,
    TRIGGER_PLACE_THREAT,
    TRIGGER_REMOVE_THREAT,
    TRIGGER_WOULD_PLACE_THREAT,
} from 'mc-shared';
import {MoveThreatEffect} from '../../src/effects/move-threat-effect.js';
import {serializeMatch} from '../../src/utils/match-serialization.js';

test('MoveThreatEffect does not persist its temporary destination ValidTarget', () => {
    const effect = new MoveThreatEffect({
        fromTarget: TARGET_SCHEME,
        match: {},
        target: TARGET_THIS,
        threat: 1,
    });

    assert.equal(Object.hasOwn(effect, 'destinationValidTarget'), false);
    assert.doesNotThrow(() => serializeMatch({effect}));
});

test('MoveThreatEffect keeps source threat when the destination cannot accept it', async () => {
    const source = {
        threat: 2,
        canRemoveThreat() {
            return true;
        },
    };
    const destination = {};
    const match = {
        schemes: [source],
    };
    const ability = {
        card: destination,
    };
    const effect = new MoveThreatEffect({
        ability,
        fromTarget: TARGET_SCHEME,
        match,
        target: TARGET_THIS,
        threat: 1,
    });

    assert.equal(effect.effectType, EFFECT_MOVE_THREAT);
    assert.equal(await effect.canRun({ability, match}), false);
    assert.equal(source.threat, 2);
});

test('MoveThreatEffect requires enough threat at the source', async () => {
    const source = {
        threat: 0,
        canRemoveThreat() {
            return true;
        },
    };
    const destination = {
        placeThreat() {},
    };
    const match = {
        schemes: [source],
    };
    const ability = {
        card: destination,
    };
    const effect = new MoveThreatEffect({
        ability,
        fromTarget: TARGET_SCHEME,
        match,
        target: TARGET_THIS,
        threat: 1,
    });

    assert.equal(await effect.canRun({ability, match}), false);
    assert.equal(source.threat, 0);
});

test('MoveThreatEffect moves only unprevented threat and shares movement trigger windows', async () => {
    const source = {
        threat: 2,
        canRemoveThreat() {
            return this.threat > 0;
        },
        removeThreat(threat) {
            this.threat = Math.max(0, this.threat - threat);
        },
        refresh() {},
        isSideScheme: false,
    };
    const destination = {
        threat: 0,
        placeThreat(threat) {
            this.threat += threat;
        },
        refresh() {},
        isMainScheme: false,
    };
    const relatedTriggers = [
        TRIGGER_PLACE_THREAT,
        TRIGGER_REMOVE_THREAT,
        TRIGGER_MOVE_THREAT,
    ];
    const windows = [];
    const match = {triggerCards: {}};
    const effect = new MoveThreatEffect({
        fromTarget: TARGET_SCHEME,
        match,
        selectedTarget: source,
        target: TARGET_THIS,
        threat: 2,
    });

    effect.createDestinationValidTarget = () => ({
        getValidTarget: () => [destination],
        selectTarget: async () => destination,
    });
    effect.trigger = async (priority, types, params) => {
        if (types.includes(TRIGGER_WOULD_PLACE_THREAT)) {
            params.effect.preventThreat = 1;
        }

        if (types.includes(TRIGGER_MOVE_THREAT)) {
            windows.push({
                destinationThreat: destination.threat,
                priority,
                selectedTarget: params.effect.selectedTarget,
                sourceThreat: source.threat,
                sourceTarget: params.effect.sourceTarget,
                types,
            });
        }

        return true;
    };

    await effect.runEffect({match});

    assert.equal(source.threat, 1);
    assert.equal(destination.threat, 1);
    assert.ok(windows.some(window =>
        window.sourceThreat === 2 &&
        window.destinationThreat === 0
    ));
    assert.ok(windows.some(window =>
        window.priority === PRIORITY_RESPONSE &&
        window.sourceThreat === 1 &&
        window.destinationThreat === 1
    ));
    assert.ok(windows.every(window =>
        relatedTriggers.every(trigger => window.types.includes(trigger))
    ));
    assert.ok(windows.every(window =>
        window.selectedTarget === destination &&
        window.sourceTarget === source
    ));
});

test('MoveThreatEffect updates the destination before defeating an emptied side scheme', async () => {
    const source = {
        threat: 1,
        canRemoveThreat() {
            return this.threat > 0;
        },
        removeThreat(threat) {
            this.threat = Math.max(0, this.threat - threat);
        },
        refresh() {},
        isSideScheme: true,
    };
    const destination = {
        threat: 0,
        placeThreat(threat) {
            this.threat += threat;
        },
        refresh() {},
        isMainScheme: false,
    };
    let defeated = false;
    const match = {
        effectsFactory: {
            createEffect({selectedTarget, type}) {
                assert.equal(type, EFFECT_DEFEAT);
                assert.equal(selectedTarget, source);
                return {
                    async runEffect() {
                        assert.equal(source.threat, 0);
                        assert.equal(destination.threat, 1);
                        defeated = true;
                    },
                };
            },
        },
        triggerCards: {},
    };
    const effect = new MoveThreatEffect({
        fromTarget: TARGET_SCHEME,
        match,
        selectedTarget: source,
        target: TARGET_THIS,
        threat: 1,
    });

    effect.createDestinationValidTarget = () => ({
        getValidTarget: () => [destination],
        selectTarget: async () => destination,
    });
    effect.trigger = async () => true;

    await effect.runEffect({match});

    assert.equal(defeated, true);
});

test('MoveThreatEffect moves the available source amount when it is below the requested amount', async () => {
    const source = {
        threat: 1,
        canRemoveThreat() {
            return this.threat > 0;
        },
        removeThreat(threat) {
            this.threat = Math.max(0, this.threat - threat);
        },
        refresh() {},
        isSideScheme: false,
    };
    const destination = {
        threat: 0,
        placeThreat(threat) {
            this.threat += threat;
        },
        refresh() {},
        isMainScheme: false,
    };
    const match = {triggerCards: {}};
    let announcedThreat;
    const effect = new MoveThreatEffect({
        fromTarget: TARGET_SCHEME,
        match,
        selectedTarget: source,
        target: TARGET_THIS,
        threat: 2,
    });

    effect.createDestinationValidTarget = () => ({
        getValidTarget: () => [destination],
        selectTarget: async () => destination,
    });
    effect.trigger = async (_priority, types, params) => {
        if (types.includes(TRIGGER_WOULD_PLACE_THREAT)) {
            announcedThreat = params.effect.threat;
        }

        return true;
    };

    await effect.runEffect({match});

    assert.equal(source.threat, 0);
    assert.equal(destination.threat, 1);
    assert.equal(effect.threat, 1);
    assert.equal(announcedThreat, 1);
});

test('MoveThreatEffect completes a main scheme at the same threshold as normal placement', async () => {
    const source = {
        threat: 1,
        canRemoveThreat() {
            return this.threat > 0;
        },
        removeThreat(threat) {
            this.threat = Math.max(0, this.threat - threat);
        },
        refresh() {},
        isSideScheme: false,
    };
    const destination = {
        threat: 1,
        value: 2,
        placeThreat(threat) {
            this.threat += threat;
        },
        refresh() {},
        isMainScheme: true,
    };
    let completed = 0;
    const match = {
        scenario: {
            async completeMainScheme(scheme) {
                assert.equal(scheme, destination);
                assert.equal(scheme.threat, 2);
                completed++;
            },
        },
        triggerCards: {},
    };
    const effect = new MoveThreatEffect({
        fromTarget: TARGET_SCHEME,
        match,
        selectedTarget: source,
        target: TARGET_THIS,
        threat: 1,
    });

    effect.createDestinationValidTarget = () => ({
        getValidTarget: () => [destination],
        selectTarget: async () => destination,
    });
    effect.trigger = async () => true;

    await effect.runEffect({match});

    assert.equal(completed, 1);
});
