import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {CARD_TYPE_SIDE_SCHEME_SCENARIO, TARGET_MAIN_SCHEME, TARGET_THIS} from 'mc-shared';
import blackPanther from '../../../mc-data/seed/catalog/heroes/blackpanther.js';
import rhino from '../../../mc-data/seed/catalog/scenarios/rhino.js';
import {EnemySchemeEffect} from '../../src/effects/enemy-scheme-effect.js';
import {MoveThreatEffect} from '../../src/effects/move-threat-effect.js';
import {PlaceThreatEffect} from '../../src/effects/place-threat-effect.js';
import {PutPlayEffect} from '../../src/effects/put-play-effect.js';
import {SeveralAttacksEffect} from '../../src/effects/several-attacks-effect.js';
import {TakeDamageEffect} from '../../src/effects/take-damage-effect.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';
import {restoreMatch, serializeMatch} from '../../src/utils/match-serialization.js';

describe('completed main schemes', () => {
    async function createMatch() {
        const match = new Match({
            name: 'completed-main-scheme',
            mc: {mcSocket: {send() {}}},
        });
        match.persist = async () => {};
        match.refresh = async () => {};
        match.openDialog = async () => ({});
        const factory = new MatchFactory(match);
        const player = match.createPlayer({
            name: 'Jugador',
            initial: true,
            superhero: factory.createSuperhero(structuredClone(blackPanther.config)),
        });
        player.initPlayer();
        const config = structuredClone(rhino.config);
        config.sets = [];
        config.defaultSets = [];
        config.manualMainSchemeProgression = true;
        config.mainSchemes[0][1].params.final = false;
        const nextScheme = structuredClone(config.mainSchemes[0]);
        nextScheme.forEach(side => {
            side.params.name = 'Segundo plan';
            side.params.stage = 2;
        });
        config.mainSchemes.push(nextScheme);
        const scenario = await factory.createScenario(config);
        match.addScenario(scenario);
        await scenario.initScenario([], false);
        match.playing = true;
        return {match, factory, player, scheme: match.mainScheme};
    }

    test('completion is claimed before dialogs and cannot run twice or reentrantly', async () => {
        const {match, player, scheme} = await createMatch();
        let completions = 0;
        match.openDialog = async dialog => {
            if (dialog.subtitle === 'Etapa completada') {
                completions++;
                assert.equal(scheme.completed, true);
                assert.equal(await match.scenario.completeMainScheme(scheme, {player}), false);
            }
            return {};
        };

        await new PlaceThreatEffect({
            match, selectedTarget: scheme, threat: scheme.value,
        }).runEffect({player});
        const threat = scheme.threat;
        const extraThreat = new PlaceThreatEffect({
            match, selectedTarget: scheme, threat: 3,
        });
        assert.ok(!await extraThreat.canRun({player}));
        await extraThreat.runEffect({player});
        scheme.placeThreat(3);
        await match.scenario.completeMainScheme(scheme, {player});

        assert.equal(completions, 1);
        assert.equal(scheme.threat, threat);
        assert.equal(extraThreat.resolved, false);
        assert.equal(scheme.canScheme(), false);
        assert.equal(scheme.canPlaceThreat(), false);
        assert.equal(scheme.canThwart(player), false);
        assert.equal(scheme.toObj({player}).completed, true);
    });

    test('restoration preserves completion and initializing a new stage clears it', async () => {
        let {match, scheme} = await createMatch();
        const player = match.initialPlayer;
        await new PlaceThreatEffect({
            match, selectedTarget: scheme, threat: scheme.value,
        }).runEffect({player});
        delete match.persist;
        delete match.refresh;
        delete match.openDialog;
        match = restoreMatch(serializeMatch(match), match.mc);
        scheme = match.mainScheme;

        assert.equal(scheme.completed, true);
        assert.equal(scheme.canPlaceThreat(), false);
        assert.equal(match.scenario.findMainScheme(2).currentSide.completed, false);
        scheme.initScheme();
        assert.equal(scheme.completed, false);
        assert.equal(scheme.canPlaceThreat(), true);
    });

    test('moving threat to a completed main scheme leaves the source unchanged', async () => {
        const {match, factory, player, scheme} = await createMatch();
        scheme.completed = true;
        const source = factory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_SIDE_SCHEME_SCENARIO,
            params: {name: 'Plan secundario', startingThreat: 3},
        }, {owner: match.scenario});
        source.threat = 3;
        const effect = new MoveThreatEffect({
            match,
            ability: {card: source},
            fromTarget: TARGET_THIS,
            target: TARGET_MAIN_SCHEME,
            selectedTarget: source,
            threat: 2,
        });

        assert.equal(effect.filterDestinationTarget(scheme, {player}), false);
        assert.equal(await effect.canRun({player}), false);
        effect.selectedDestination = scheme;
        await effect.execute({player});
        assert.equal(source.threat, 3);
        assert.equal(scheme.threat, 0);
        assert.equal(effect.movedThreat, 0);
    });

    test('completed schemes reject enemy activations without boosts or consuming Confused', async () => {
        const {match, player, scheme} = await createMatch();
        scheme.completed = true;
        match.villain.confused = 1;
        match.drawEncounterCards = async () => {
            assert.fail('A completed scheme cannot start a boost-card draw.');
        };
        const effect = new EnemySchemeEffect({
            match, enemy: match.villain, selectedTarget: scheme,
        });

        assert.equal(await effect.canRun({player}), false);
        await effect.runEffect({player});
        assert.equal(match.villain.confused, 1);
        assert.equal(scheme.threat, 0);
        assert.equal(effect.resolved, false);
        assert.equal(effect.threatPlaced, 0);
    });

    test('encounter group attacks still resolve after the main scheme completes', async () => {
        const {match, player, scheme} = await createMatch();
        scheme.completed = true;
        const effect = new SeveralAttacksEffect({match, enemies: [match.villain]});
        const activated = [];
        effect.activate = async enemy => {
            activated.push(enemy);
        };

        await effect.runEffect({player});

        assert.deepEqual(activated, [match.villain]);
    });

    test('multi-target threat skips a completed plan without suppressing other schemes or satisfying Then', async () => {
        const {match, factory, player, scheme} = await createMatch();
        scheme.completed = true;
        const sideScheme = factory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_SIDE_SCHEME_SCENARIO,
            params: {name: 'Plan secundario', startingThreat: 3},
        }, {owner: match.scenario});
        await new PutPlayEffect({match, card: sideScheme}).runEffect({player, card: sideScheme});
        const startingThreat = sideScheme.threat;
        const effect = new PlaceThreatEffect({
            match,
            selectedTarget: [scheme, sideScheme],
            threat: 2,
            thenEffect: new TakeDamageEffect({
                match, selectedTarget: player.superhero, damage: 1,
            }),
        });

        await effect.runEffect({player});

        assert.equal(scheme.threat, 0);
        assert.equal(sideScheme.threat, startingThreat + 2);
        assert.equal(effect.resolved, true);
        assert.equal(effect.fullResolved, false);
        assert.equal(player.superhero.damage, 0);
    });
});
