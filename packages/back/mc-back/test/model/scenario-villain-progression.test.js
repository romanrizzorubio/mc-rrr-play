import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    ABILITY_WHEN_REVEALED,
    CARD_TYPE_MINION,
    CARD_TYPE_TREACHERY,
    DIALOG_ACTIVATE,
    DIALOG_ENCOUNTERS_REVEAL,
    EFFECT_CHAINED,
    EFFECT_PLACE_THREAT,
    EFFECT_TAKE_DAMAGE,
    MATCH_END_REASON_VILLAIN_DEFEATED,
    TARGET_MAIN_SCHEME,
    TARGET_YOUR_SUPERHERO,
} from 'mc-shared';
import {EVENTS} from 'mc-endpoints';
import blackPanther from '../../../mc-data/seed/catalog/heroes/blackpanther.js';
import kang from '../../../mc-data/seed/catalog/scenarios/kang.js';
import rhino from '../../../mc-data/seed/catalog/scenarios/rhino.js';
import standard from '../../../mc-data/seed/catalog/sets/standard.js';
import temporal from '../../../mc-data/seed/catalog/sets/temporal.js';
import {AddScenarioVillainEffect} from '../../src/effects/add-scenario-villain-effect.js';
import {DefeatEffect} from '../../src/effects/defeat-effect.js';
import {PlaceThreatEffect} from '../../src/effects/place-threat-effect.js';
import {PlayVillainPhaseEffect} from '../../src/effects/play-villain-phase-effect.js';
import {RevealEncounterEffect} from '../../src/effects/reveal-encounter-effect.js';
import {WinGameEffect} from '../../src/effects/win-game-effect.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';
import {restoreMatch, serializeMatch} from '../../src/utils/match-serialization.js';

describe('scenario villain progression', () => {
    async function createMatch(config, {players = 1, expert = false} = {}) {
        const setConfigs = new Map([
            ['standard', standard.config],
            ['temporal', temporal.config],
        ]);
        const match = new Match({
            name: 'villain-progression',
            mc: {
                mcSocket: {send() {}},
                data: {async getSetConfig(id) {return setConfigs.get(id);}},
            },
        });
        match.persist = async () => {};
        match.refresh = async () => {};
        match.openDialog = async dialog => ({
            selected: dialog.data?.cards?.[0] ?? dialog.data?.options?.[0],
        });
        const factory = new MatchFactory(match);
        for (let index = 0; index < players; index++) {
            const player = match.createPlayer({
                name: `Jugador ${index + 1}`,
                initial: index === 0,
                superhero: factory.createSuperhero({
                    ...blackPanther.config,
                    obligation: undefined,
                }),
            });
            player.initPlayer();
            player.superhero.selectedSide = 1;
        }
        match.currentPlayer = match.initialPlayer;
        match.expert = expert;
        const scenario = await factory.createScenario(config);
        match.addScenario(scenario);
        await scenario.initScenario([], expert);
        match.initNemesis();
        match.playing = true;
        return match;
    }

    async function defeat(match, villain, player = match.initialPlayer) {
        const effect = new DefeatEffect({match, selectedTarget: villain});
        await effect.runEffect({player});
        assert.equal(effect.defeated, true);
    }

    function createSequence(count, manualVillainProgression) {
        const config = structuredClone(rhino.config);
        config.cards = [];
        config.sets = [];
        config.defaultSets = [];
        config.manualVillainProgression = manualVillainProgression;
        config.villains = Array.from({length: count}, (_, index) => ({
            ...rhino.config.villains[0],
            params: {
                ...rhino.config.villains[0].params,
                name: `Villano ${index + 1}`,
                stage: index + 1,
            },
        }));
        config.expertVillains = config.villains.slice();
        return config;
    }

    test('Rhino II is shared by the normal and expert sequences', async () => {
        const match = await createMatch({
            ...structuredClone(rhino.config),
            cards: [],
            sets: [],
            defaultSets: [],
        });
        const {scenario} = match;
        assert.equal(new Set([...scenario.villains, ...scenario.expertVillains]).size, 3);
        assert.equal(scenario.villains[1], scenario.expertVillains[0]);
        assert.equal(scenario.villains[1].stage, 2);
        assert.deepEqual(scenario.villains.map(card => card.stage), [1, 2]);
        assert.deepEqual(scenario.expertVillains.map(card => card.stage), [2, 3]);
        assert.equal(Object.hasOwn(scenario, 'standardVillains'), false);
        assert.equal(Object.hasOwn(scenario, 'extraVillains'), false);
        for (const field of ['allVillains', 'villainSequence', 'remainingVillains', 'nextVillainIndex']) {
            assert.equal(field in scenario, false);
        }
    });

    test('advancing the main scheme discards cards tucked or facedown under the old stage', async () => {
        const match = await createMatch(kang.config);
        const {scenario} = match;
        const currentScheme = scenario.gameZone.currentScheme;
        const discarded = [];
        const facedownCard = {
            isEncounterCard: true,
            async discard() {
                discarded.push(this);
            },
        };
        const tuckedCard = {
            isEncounterCard: true,
            async discard() {
                discarded.push(this);
            },
        };
        currentScheme.addFaceDown(facedownCard);
        currentScheme.tuckedCards.push(tuckedCard);

        await scenario.advanceMainScheme(
            scenario.gameZone, 2, match.initialPlayer
        );

        assert.deepEqual(discarded, [facedownCard, tuckedCard]);
        assert.deepEqual(currentScheme.faceDown, []);
        assert.deepEqual(currentScheme.tuckedCards, []);
    });

    test('manual progression preserves cards under a villain when the next stage has the same title', async () => {
        const config = createSequence(2, true);
        config.villains[1].params.name = config.villains[0].params.name;
        config.expertVillains = config.villains.slice();
        const match = await createMatch(config);
        const {scenario} = match;
        const currentVillain = scenario.gameZone.currentVillain;
        const nextVillain = scenario.villains[1];
        const discarded = [];
        const facedownCard = {
            isEncounterCard: true,
            async discard() {
                discarded.push(this);
            },
        };
        const tuckedCard = {
            id: 'tucked-card',
            name: 'Carta metida debajo',
            isEncounterCard: true,
            toObj() {
                return {id: this.id, name: this.name};
            },
            async discard() {
                discarded.push(this);
            },
        };
        currentVillain.addFaceDown(facedownCard);
        currentVillain.tuckedCards.push(tuckedCard);

        await defeat(match, currentVillain);

        assert.equal(scenario.gameZone.currentVillain, null);
        assert.deepEqual(discarded, []);
        assert.deepEqual(nextVillain.faceDown, currentVillain.faceDown);
        assert.equal(nextVillain.faceDown[0].attached, nextVillain);
        assert.deepEqual(nextVillain.tuckedCards, [tuckedCard]);

        await scenario.addVillainToZone({
            zone: scenario.gameZone,
            name: nextVillain.name,
            stage: nextVillain.stage,
            player: match.initialPlayer,
        });

        assert.equal(scenario.gameZone.currentVillain, nextVillain);
        assert.deepEqual(nextVillain.tuckedCards, [tuckedCard]);
        assert.equal(nextVillain.faceDown[0].card, facedownCard);
    });

    test('an empty sequence for the selected difficulty is rejected instead of winning at setup', async () => {
        const config = createSequence(1, false);
        config.expertVillains = [];
        await assert.rejects(createMatch(config, {expert: true}),
            /no define una secuencia de Villanos/);
    });

    test('legacy manual setup cannot infer victory from its initial villain list', async () => {
        const config = createSequence(3, true);
        delete config.expertVillains;
        config.mainSchemes[0][0].params.content = {
            villains: [1],
            villainsExpert: [1],
        };
        await assert.rejects(createMatch(config),
            /Actualiza el catálogo.*progresión manual/);
    });

    for (const field of ['villainsExpert', 'extraVillains']) {
        test(`obsolete ${field} catalog field is rejected rather than dropping its villains`, async () => {
            const config = createSequence(2, false);
            config[field] = config.expertVillains;
            await assert.rejects(createMatch(config),
                /Actualiza el catálogo.*únicamente en villains y expertVillains/);
        });
    }

    test('normal and expert use their explicit cards, including shared and distinct cards with the same stage number', async () => {
        const config = createSequence(3, false);
        const [shared, normalSecond, expertSecond] = config.villains;
        shared.params.stage = 9;
        normalSecond.params.stage = 2;
        expertSecond.params.stage = 2;
        expertSecond.params.name = normalSecond.params.name;
        expertSecond.params.hitPoints = 23;
        const expertLast = {
            ...normalSecond,
            params: {
                ...normalSecond.params,
                name: 'Último villano experto',
                stage: 1,
                hitPoints: 7,
            },
        };
        config.villains = [shared, normalSecond];
        config.expertVillains = [shared, expertSecond, expertLast];

        for (const expert of [false, true]) {
            const match = await createMatch(config, {expert});
            const {scenario} = match;
            assert.equal(new Set([...scenario.villains, ...scenario.expertVillains]).size, 4);
            assert.equal(scenario.villains[0], scenario.expertVillains[0]);
            assert.notEqual(scenario.villains[1], scenario.expertVillains[1]);
            assert.equal(scenario.findVillain({
                name: normalSecond.params.name,
                stage: 2,
            }), expert ? scenario.expertVillains[1] : scenario.villains[1]);
            const expected = expert ? config.expertVillains : config.villains;
            for (const [index, definition] of expected.entries()) {
                const villain = scenario.gameZone.currentVillain;
                assert.equal(villain.name, definition.params.name);
                assert.equal(villain.stage, definition.params.stage);
                assert.equal(villain.card.image, definition.params.image);
                assert.equal(await villain.getHitPoints({
                    player: match.initialPlayer,
                }), Array.isArray(definition.params.hitPoints) ?
                    definition.params.hitPoints[0] : definition.params.hitPoints);
                await defeat(match, villain);
                assert.equal(match.playing, index < expected.length - 1);
            }
            assert.equal(match.gameOverReason, MATCH_END_REASON_VILLAIN_DEFEATED);
        }
    });

    test('saved matches retain pending stages and victory deferred until all active villains leave', async () => {
        const config = createSequence(2, true);
        const original = await createMatch(config);
        const {scenario} = original;
        const finalZone = scenario.createZone();
        await scenario.addVillainToZone({
            zone: finalZone,
            name: 'Villano 2',
            stage: 2,
            player: original.initialPlayer,
        });
        await defeat(original, finalZone.currentVillain);
        assert.equal(original.playing, true);
        assert.equal(scenario.finalVillainDefeated, true);
        delete original.persist;
        delete original.refresh;
        delete original.openDialog;
        const snapshot = serializeMatch(original);
        for (const node of snapshot.nodes) {
            for (const [field] of node.properties ?? []) {
                assert.ok(!['allVillains', 'villainSequence', 'remainingVillains', 'nextVillainIndex'].includes(field));
            }
        }
        const restored = restoreMatch(snapshot, original.mc);
        restored.persist = async () => {};
        restored.refresh = async () => {};
        restored.openDialog = async dialog => ({
            selected: dialog.data?.cards?.[0] ?? dialog.data?.options?.[0],
        });

        assert.equal(restored.scenario.finalVillainDefeated, true);
        assert.equal(restored.scenario.villains[0], restored.scenario.gameZone.currentVillain);
        await defeat(restored, restored.scenario.gameZone.currentVillain);
        assert.equal(restored.playing, false);
        assert.equal(restored.gameOverReason, MATCH_END_REASON_VILLAIN_DEFEATED);
    });

    test('restoring a match preserves the exact ordered cards still to be defeated', async () => {
        const original = await createMatch(createSequence(3, false));
        await defeat(original, original.scenario.gameZone.currentVillain);
        delete original.persist;
        delete original.refresh;
        delete original.openDialog;
        const restored = restoreMatch(serializeMatch(original), original.mc);
        restored.persist = async () => {};
        restored.refresh = async () => {};
        restored.openDialog = async dialog => ({
            selected: dialog.data?.cards?.[0] ?? dialog.data?.options?.[0],
        });

        assert.equal(restored.scenario.gameZone.currentVillain.name, 'Villano 2');
        assert.equal(restored.scenario.villains[2].name, 'Villano 3');
        await defeat(restored, restored.scenario.gameZone.currentVillain);
        assert.equal(restored.playing, true);
        assert.equal(restored.scenario.gameZone.currentVillain.name, 'Villano 3');
        await defeat(restored, restored.scenario.gameZone.currentVillain);
        assert.equal(restored.playing, false);
        assert.equal(restored.gameOverReason, MATCH_END_REASON_VILLAIN_DEFEATED);
    });

    test('a saved current villain outside its difficulty list is rejected instead of guessing progression', async () => {
        const original = await createMatch(createSequence(2, false));
        original.scenario.villains = original.scenario.villains.slice(1);
        delete original.persist;
        delete original.refresh;
        delete original.openDialog;

        assert.throws(() => restoreMatch(serializeMatch(original), original.mc),
            /configuración antigua de Villanos; inicia una nueva partida/);
    });

    for (const expert of [false, true]) {
        test(`restoring the previous ${expert ? 'expert' : 'normal'} format continues from the current villain only`, async () => {
            const original = await createMatch(createSequence(3, false), {expert});
            await defeat(original, original.scenario.gameZone.currentVillain);
            const {scenario} = original;
            scenario.allVillains = [...new Set([...scenario.villains, ...scenario.expertVillains])];
            scenario.villainSequence = scenario.getVillains();
            scenario.remainingVillains = scenario.getVillains().slice(2);
            scenario.nextVillainIndex = 2;
            delete original.persist;
            delete original.refresh;
            delete original.openDialog;
            const restored = restoreMatch(serializeMatch(original), original.mc);
            restored.persist = async () => {};
            restored.refresh = async () => {};
            restored.openDialog = async dialog => ({
                selected: dialog.data?.cards?.[0] ?? dialog.data?.options?.[0],
            });

            assert.equal(restored.expert, expert);
            assert.equal(restored.scenario.getVillains(),
                expert ? restored.scenario.expertVillains : restored.scenario.villains);
            for (const field of ['allVillains', 'villainSequence', 'remainingVillains', 'nextVillainIndex']) {
                assert.equal(field in restored.scenario, false);
            }
            await defeat(restored, restored.scenario.gameZone.currentVillain);
            assert.equal(restored.scenario.gameZone.currentVillain.name, 'Villano 3');
            assert.equal(restored.playing, true);
            await defeat(restored, restored.scenario.gameZone.currentVillain);
            assert.equal(restored.gameOverReason, MATCH_END_REASON_VILLAIN_DEFEATED);
        });

        test(`automatic progression follows the ${expert ? 'expert' : 'normal'} current villain after effects move forward and backward`, async () => {
            const match = await createMatch(createSequence(4, false), {expert});
            const {scenario} = match;
            const first = scenario.gameZone.currentVillain;
            for (const index of [2, 1]) {
                const villain = scenario.getVillains()[index];
                await new AddScenarioVillainEffect({
                    match,
                    name: villain.name,
                    stage: villain.stage,
                }).runEffect({player: match.initialPlayer});
                assert.equal(scenario.gameZone.currentVillain, villain);
            }
            await first.defeat(match.initialPlayer);
            assert.equal(scenario.gameZone.currentVillain, scenario.getVillains()[1]);
            for (const index of [1, 2, 3]) {
                const villain = scenario.gameZone.currentVillain;
                assert.equal(villain, scenario.getVillains()[index]);
                await defeat(match, villain);
                assert.equal(match.playing, index !== 3);
            }
            assert.equal(match.gameOverReason, MATCH_END_REASON_VILLAIN_DEFEATED);
        });

        test(`card effects skip the ${expert ? 'expert' : 'normal'} sequence without changing either configured list`, async () => {
            const config = createSequence(4, true);
            config.expertVillains = config.villains.map(card => ({
                ...card,
                params: {...card.params, name: `${card.params.name} experto`},
            }));
            const match = await createMatch(config, {expert});
            const {scenario} = match;
            const sequence = expert ? scenario.expertVillains : scenario.villains;
            const otherSequence = expert ? scenario.villains : scenario.expertVillains;
            const [first, skipped, third, last] = sequence;
            await defeat(match, first);
            assert.equal(scenario.gameZone.currentVillain, null);
            assert.equal(match.playing, true);

            await assert.rejects(new AddScenarioVillainEffect({
                match,
                name: otherSequence[2].name,
                stage: otherSequence[2].stage,
            }).runEffect({player: match.initialPlayer}), /No se encontró el Villano/);
            assert.equal(scenario.gameZone.currentVillain, null);

            for (const villain of [third, last]) {
                const effect = new AddScenarioVillainEffect({
                    match,
                    name: villain.name,
                    stage: villain.stage,
                });
                await effect.runEffect({player: match.initialPlayer});
                assert.equal(effect.resolved, true);
                assert.equal(scenario.gameZone.currentVillain, villain);
                assert.equal(skipped.isInPlay, false);
                assert.deepEqual(sequence, [first, skipped, third, last]);
                assert.equal(otherSequence.length, 4);
                await defeat(match, villain);
                assert.equal(match.playing, villain !== last);
            }
            assert.equal(match.gameOverReason, MATCH_END_REASON_VILLAIN_DEFEATED);
        });
    }

    test('obsolete queue and index values do not override the saved current villain', async () => {
        const original = await createMatch(createSequence(3, false));
        original.scenario.remainingVillains = [original.scenario.villains[2], original.scenario.villains[1]];
        original.scenario.nextVillainIndex = 99;
        delete original.persist;
        delete original.refresh;
        delete original.openDialog;
        const restored = restoreMatch(serializeMatch(original), original.mc);
        restored.persist = async () => {};
        restored.refresh = async () => {};
        restored.openDialog = async dialog => ({
            selected: dialog.data?.cards?.[0] ?? dialog.data?.options?.[0],
        });
        assert.equal(restored.scenario.gameZone.currentVillain, restored.scenario.villains[0]);
        assert.equal('nextVillainIndex' in restored.scenario, false);
        await defeat(restored, restored.scenario.gameZone.currentVillain);
        assert.equal(restored.scenario.gameZone.currentVillain, restored.scenario.villains[1]);
        assert.equal(restored.playing, true);
    });

    for (const count of [1, 3, 5]) {
        for (const manual of [false, true]) {
            test(`${manual ? 'manual' : 'automatic'} progression wins only after ${count} differently named villains`, async () => {
                const config = createSequence(count, manual);
                config.expertVillains.push({
                    ...rhino.config.villains[0],
                    params: {
                        ...rhino.config.villains[0].params,
                        name: 'Villano de otra dificultad',
                        stage: 99,
                        expert: true,
                    },
                });
                const match = await createMatch(config);
                const {scenario} = match;
                for (let stage = 1; stage <= count; stage++) {
                    if (manual && stage > 1) {
                        await scenario.addVillainToZone({
                            zone: scenario.gameZone,
                            name: `Villano ${stage}`,
                            stage,
                            player: match.initialPlayer,
                        });
                    }
                    const villain = scenario.gameZone.currentVillain;
                    assert.equal(villain.name, `Villano ${stage}`);
                    const discardedUnder = [];
                    if (stage === 1 && stage < count) {
                        villain.addFaceDown({
                            isEncounterCard: true,
                            async discard() {
                                discardedUnder.push('facedown');
                            },
                        });
                        villain.tuckedCards.push({
                            id: 'tucked-card',
                            name: 'Carta metida debajo',
                            isEncounterCard: true,
                            toObj() {
                                return {id: this.id, name: this.name};
                            },
                            async discard() {
                                discardedUnder.push('tucked');
                            },
                        });
                    }
                    await defeat(match, villain);
                    if (stage < count) {
                        assert.equal(match.playing, true);
                        assert.equal(match.gameOverReason, null);
                        if (stage === 1) {
                            assert.deepEqual(discardedUnder, [
                                'facedown',
                                'tucked',
                            ]);
                        }
                        if (manual) {
                            assert.equal(scenario.gameZone.currentVillain, null);
                        } else {
                            assert.equal(scenario.gameZone.currentVillain.stage, stage + 1);
                        }
                    } else {
                        assert.equal(match.playing, false);
                        assert.equal(match.gameOverReason, MATCH_END_REASON_VILLAIN_DEFEATED);
                    }
                }
            });
        }
    }

    for (const {stages, reverse} of [
        {stages: [1, 1, 1, 1, 1], reverse: false},
        {stages: [1, 2, 3, 4, 5], reverse: false},
        {stages: [5, 4, 3, 2, 1], reverse: false},
        {stages: [1, 2, 3, 4, 5], reverse: true},
    ]) {
    test(`five concurrent villains ${stages.join(',')} defeated ${reverse ? 'last-first' : 'in order'} must all leave before victory`, async () => {
        const config = createSequence(5, true);
        config.villains.forEach((villain, index) => {
            villain.params.stage = stages[index];
        });
        const match = await createMatch(config);
        const {scenario} = match;
        for (let index = 1; index < config.villains.length; index++) {
            const zone = scenario.createZone();
            await scenario.addVillainToZone({
                zone,
                name: `Villano ${index + 1}`,
                stage: stages[index],
                player: match.initialPlayer,
            });
        }

        const zones = scenario.zones.slice();
        if (reverse) {
            zones.reverse();
        }
        for (const [index, zone] of zones.entries()) {
            const villain = zone.currentVillain;
            if (index === (reverse ? 0 : zones.length - 1)) {
                assert.equal(villain, scenario.getVillains().at(-1));
            }
            await defeat(match, villain);
            if (index < zones.length - 1) {
                assert.equal(match.playing, true);
                assert.equal(match.gameOverReason, null);
                assert.equal(zone.currentVillain, null);
            } else {
                assert.equal(match.playing, false);
                assert.equal(match.gameOverReason, MATCH_END_REASON_VILLAIN_DEFEATED);
            }
        }
    });
    }

    for (const expert of [false, true]) {
        test(`Kang III ${expert ? 'expert' : 'normal'} wins through When Defeated even with a later villain pending`, async () => {
            const pendingDefinition = createSequence(1, false).villains[0];
            pendingDefinition.params.name = 'Villano posterior a Kang';
            const match = await createMatch({
                ...kang.config,
                villains: [...kang.config.villains, pendingDefinition],
                expertVillains: [...kang.config.expertVillains, pendingDefinition],
            }, {expert});
            const {scenario} = match;
            await scenario.advanceMainScheme(
                scenario.gameZone,
                4,
                match.initialPlayer,
            );
            const villain = scenario.gameZone.currentVillain;
            const ability = villain.abilities.find(candidate =>
                candidate.isWhenDefeated);
            assert.ok(ability);
            assert.equal(ability.hideDialog, true);
            assert.ok(ability.effect instanceof WinGameEffect);
            assert.equal(typeof ability.effect.canRun, 'function');
            const pendingVillain = scenario.getVillains().at(-1);
            assert.equal(scenario.isFinalVillain(villain), false);
            const emitted = [];
            match.mc.mcSocket.send = (name, event) => emitted.push(event);
            let finishes = 0;
            const finishGame = match.finishGame.bind(match);
            match.finishGame = async reason => {
                finishes++;
                await finishGame(reason);
            };
            const dialogs = [];
            match.openDialog = async dialog => {
                dialogs.push(dialog);
                assert.equal(match.gameOverReason, null,
                    'No further dialogs should open after the win effect');
                return {selected: dialog.data?.cards?.[0] ?? dialog.data?.options?.[0]};
            };

            await defeat(match, villain);

            assert.equal(dialogs.length, 1);
            assert.equal(dialogs[0].dialogType, DIALOG_ENCOUNTERS_REVEAL);
            assert.equal(dialogs[0].title, `${villain.name} ha sido derrotado`);
            assert.equal(ability.effect.resolved, true);
            assert.equal(match.playing, false);
            assert.equal(match.gameOverReason, MATCH_END_REASON_VILLAIN_DEFEATED);
            assert.equal(scenario.gameZone.currentVillain, villain);
            assert.equal(scenario.getVillains().at(-1), pendingVillain);
            assert.equal(scenario.finalVillainDefeated, false);
            assert.equal(finishes, 1);
            assert.equal(emitted.filter(event =>
                event === EVENTS.SCENARIO.DEFEAT).length, 1);

            await scenario.winGame();
            assert.equal(finishes, 1);
            assert.equal(emitted.filter(event =>
                event === EVENTS.SCENARIO.DEFEAT).length, 1);
        });

        for (const players of [1, 2]) {
        test(`Kang ${expert ? 'expert' : 'normal'} with ${players} players stops remaining minions but resolves treacheries after scheme completion`, async () => {
            const match = await createMatch(kang.config, {players, expert});
            const {scenario} = match;
            const player = match.initialPlayer;
            await scenario.advanceMainScheme(scenario.gameZone, 2, player);
            player.superhero.selectedSide = 0;
            const scheme = player.scenarioZone.currentScheme.currentSide;
            const villain = player.scenarioZone.currentVillain;
            const factory = new MatchFactory(match);
            const minions = [];
            for (let index = 0; index < 3; index++) {
                const minion = factory.cardsFactory.createGameCardFromConfig({
                    type: CARD_TYPE_MINION,
                    params: {name: `Esbirro ${index + 1}`, scheme: 2, attack: 1, hitPoints: 3},
                }, {owner: scenario});
                await new RevealEncounterEffect({
                    match, selectedTarget: minion,
                }).runEffect({player});
                minions.push(minion);
            }
            minions[1].confused = 1;
            minions[2].confused = 1;
            scheme.threat = scheme.value - 1 - await villain.getSchemeValue({player}) - 2;
            scenario.deck.cards = Array.from({length: 20}, (_, index) =>
                factory.cardsFactory.createGameCardFromConfig({
                    type: CARD_TYPE_TREACHERY,
                    params: {name: `Encuentro neutral ${index + 1}`, boost: 0},
                }, {owner: scenario}));
            const treachery = factory.cardsFactory.createGameCardFromConfig({
                type: CARD_TYPE_TREACHERY,
                params: {
                    name: 'Amenaza y daño',
                    boost: 0,
                    abilities: [{
                        type: ABILITY_WHEN_REVEALED,
                        params: {
                            effect: {
                                type: EFFECT_CHAINED,
                                params: {
                                    effects: [
                                        {type: EFFECT_PLACE_THREAT, params: {target: TARGET_MAIN_SCHEME, threat: 5}},
                                        {type: EFFECT_TAKE_DAMAGE, params: {target: TARGET_YOUR_SUPERHERO, damage: 1}},
                                    ],
                                },
                            },
                        },
                    }],
                },
            }, {owner: scenario});
            match.players.forEach(targetPlayer => {
                targetPlayer.gameZone.encounters = [];
            });
            player.gameZone.encounters = [treachery];
            const dialogs = [];
            match.openDialog = async dialog => {
                dialogs.push(dialog);
                return {selected: dialog.data?.cards?.[0] ?? dialog.data?.options?.[0]};
            };
            match.villainPhaseStep = 0;
            const phase = new PlayVillainPhaseEffect({match});

            await phase.runEffect({player});

            assert.equal(scheme.completed, true);
            assert.equal(scheme.threat, scheme.value);
            assert.equal(dialogs.filter(dialog => dialog.dialogType === DIALOG_ACTIVATE).length, players + 1);
            assert.equal(minions[1].confused, 1);
            assert.equal(minions[2].confused, 1);
            assert.equal(player.superhero.damage, 1);
            assert.equal(player.encounters.length, 0);
            assert.ok(scenario.deck.discardPile.includes(treachery));
            if (players > 1) {
                const otherPlayer = match.players[1];
                assert.ok(otherPlayer.superhero.damage > 0);
                assert.equal(otherPlayer.scenarioZone.currentScheme.currentSide.completed, false);
                await defeat(match, otherPlayer.scenarioZone.currentVillain, otherPlayer);
            }
            assert.equal(scenario.gameZone.currentScheme.currentSide.stage, 4);
            assert.equal(scenario.gameZone.inPlayCards.filter(card =>
                card.name === 'El dominio de Kang').length, 1);
            assert.equal(scenario.apart.filter(card =>
                card.name === 'El dominio de Kang').length, 3);
        });
        }
        for (const players of [2, 4]) {
            for (const restored of [false, true]) {
                test(`Kang ${expert ? 'expert' : 'normal'} with ${players} players reveals one Dominion after one hero defeat${restored ? ' in a restored match' : ''}`, async () => {
                    let match = await createMatch(kang.config, {players, expert});
                    await match.scenario.advanceMainScheme(
                        match.scenario.gameZone, 2, match.initialPlayer
                    );
                    if (restored) {
                        delete match.persist;
                        delete match.refresh;
                        delete match.openDialog;
                        match = restoreMatch(serializeMatch(match), match.mc);
                        match.persist = async () => {};
                        match.refresh = async () => {};
                        match.openDialog = async dialog => ({
                            selected: dialog.data?.cards?.[0] ?? dialog.data?.options?.[0],
                        });
                    }
                    const {scenario} = match;
                    const failedPlayer = match.initialPlayer;
                    const stageFour = scenario.findMainScheme(4);
                    const asideCards = scenario.apart.filter(card =>
                        card.name === 'El dominio de Kang');
                    assert.equal(asideCards.length, 4);
                    assert.equal(stageFour.faceDown.length, 0);

                    await defeat(match, failedPlayer.superhero, failedPlayer);

                    assert.equal(failedPlayer.defeated, true);
                    assert.equal(stageFour.faceDown.length, 1);
                    assert.equal(stageFour.faceDown[0].card, asideCards[0]);
                    assert.equal(scenario.apart.filter(card =>
                        card.name === 'El dominio de Kang').length, 3);
                    for (const player of match.players.filter(candidate =>
                        !candidate.defeated)) {
                        if (player.scenarioZone.currentScheme.currentSide.stage === 3) {
                            await defeat(match, player.scenarioZone.currentVillain, player);
                        }
                    }

                    assert.equal(scenario.gameZone.currentScheme.currentSide.stage, 4);
                    assert.equal(stageFour.faceDown.length, 0);
                    const dominions = scenario.gameZone.inPlayCards.filter(card =>
                        card.name === 'El dominio de Kang');
                    assert.equal(dominions.length, 1);
                    assert.equal(dominions[0], asideCards[0]);
                    assert.equal(scenario.apart.filter(card =>
                        card.name === 'El dominio de Kang').length, 3);
                });
            }
        }
        for (const players of [1, 2, 4]) {
            test(`Kang ${expert ? 'expert' : 'normal'} with ${players} players reveals one Dominion after one local scheme completes`, async () => {
                const match = await createMatch(kang.config, {players, expert});
                const {scenario} = match;
                await scenario.advanceMainScheme(scenario.gameZone, 2, match.initialPlayer);
                const failedPlayer = match.initialPlayer;
                const sourceZone = failedPlayer.scenarioZone;
                const scheme = failedPlayer.scenarioZone.currentScheme.currentSide;
                const stageFour = scenario.findMainScheme(4);
                const asideCard = scenario.apart.find(card =>
                    card.name === 'El dominio de Kang');
                const effect = new PlaceThreatEffect({
                    match,
                    selectedTarget: scheme,
                    threat: scheme.value,
                });

                await effect.runEffect({player: failedPlayer});

                assert.equal(scenario.zones.includes(sourceZone), false);
                if (players === 1) {
                    assert.equal(stageFour.faceDown.length, 0);
                    assert.equal(scenario.gameZone.currentScheme.currentSide.stage, 4);
                } else {
                    assert.equal(stageFour.faceDown.length, 1);
                    assert.equal(stageFour.faceDown[0].card, asideCard);
                }
                for (const player of match.players) {
                    if (player.scenarioZone.currentScheme.currentSide.stage === 3) {
                        await defeat(match, player.scenarioZone.currentVillain, player);
                    }
                }
                assert.equal(scenario.gameZone.currentScheme.currentSide.stage, 4);
                assert.equal(stageFour.faceDown.length, 0);
                assert.equal(scenario.gameZone.inPlayCards.filter(card =>
                    card.name === 'El dominio de Kang').length, 1);
                assert.equal(scenario.apart.filter(card =>
                    card.name === 'El dominio de Kang').length, 3);
            });
            test(`Kang ${expert ? 'expert' : 'normal'} with ${players} players removes all Stage II villains before Kang III enters play when local schemes complete`, async () => {
                const match = await createMatch(kang.config, {players, expert});
                const {scenario} = match;
                await scenario.advanceMainScheme(
                    scenario.gameZone,
                    2,
                    match.initialPlayer
                );

                const splitZones = scenario.zones.filter(zone =>
                    zone.currentScheme?.currentSide.stage === 3);
                assert.equal(splitZones.length, players);
                assert.ok(splitZones.every(zone =>
                    zone.currentVillain?.stage === 2));

                for (const zone of splitZones) {
                    if (!scenario.zones.includes(zone)) {
                        continue;
                    }

                    const scheme = zone.currentScheme.currentSide;
                    await new PlaceThreatEffect({
                        match,
                        selectedTarget: scheme,
                        threat: scheme.value,
                    }).runEffect({player: zone.players[0]});
                }

                assert.equal(scenario.zones.length, 1);
                assert.equal(scenario.gameZone.currentScheme.currentSide.stage, 4);
                assert.equal(scenario.gameZone.currentVillain.stage, 3);
                assert.equal(
                    match.inPlayCards.filter(card =>
                        card.isVillain && card.stage === 2).length,
                    0
                );
            });
            test(`Kang ${expert ? 'expert' : 'standard'} with ${players} players continues through split villains to stage III`, async () => {
                const match = await createMatch(kang.config, {players, expert});
                const {scenario} = match;
                assert.deepEqual(scenario.villains.map(card => card.stage), [1, 2, 2, 2, 2, 3]);
                assert.deepEqual(scenario.expertVillains.map(card => card.stage), [1, 2, 2, 2, 2, 3]);
                assert.equal(scenario.getVillains(), expert ? scenario.expertVillains : scenario.villains);
                await defeat(match, scenario.gameZone.currentVillain);

                assert.equal(match.playing, true);
                assert.equal(scenario.gameZone.currentScheme.currentSide.stage, 2);
                const splitZones = scenario.zones.filter(zone =>
                    zone.currentVillain?.stage === 2);
                assert.equal(splitZones.length, players);
                for (const zone of splitZones) {
                    assert.equal(zone.currentVillain.card.expert, expert);
                    assert.equal(await zone.currentVillain.getHitPoints({
                        player: zone.players[0],
                    }), expert ? 22 : 18);
                    await defeat(match, zone.currentVillain, zone.players[0]);
                    assert.equal(match.playing, true);
                    assert.equal(match.gameOverReason, null);
                    assert.equal(scenario.zones.includes(zone), false);
                }

                assert.equal(scenario.zones.length, 1);
                assert.ok(match.players.every(player =>
                    player.scenarioZone === scenario.gameZone));
                assert.equal(scenario.gameZone.currentScheme.currentSide.stage, 4);
                const finalVillain = scenario.gameZone.currentVillain;
                assert.equal(finalVillain.name, 'Kang (El Conquistador)');
                assert.equal(finalVillain.stage, 3);
                assert.equal(Boolean(finalVillain.card.expert), expert);
                assert.equal(await finalVillain.getHitPoints({
                    player: match.initialPlayer,
                }), (expert ? 25 : 20) * players);
                assert.equal(scenario.villains.length, 6);
                assert.equal(scenario.expertVillains.length, 6);

                await defeat(match, finalVillain);

                assert.equal(match.playing, false);
                assert.equal(match.gameOverReason, MATCH_END_REASON_VILLAIN_DEFEATED);
            });
        }
    }
});
