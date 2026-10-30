import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    CALC_COUNT,
    DIALOG_SELECT_TARGET,
    TARGET_ALL_PLAYERS,
    TARGET_ANY_PLAYER,
    TARGET_YOU,
} from 'mc-shared';
import blackWidow from '../../../mc-data/seed/catalog/heroes/black-widow.js';
import {DrawEffect} from '../../src/effects/draw-effect.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';

describe('Draw effect player targets', () => {
    const createGame = (count = 3) => {
        const match = new Match({
            name: 'draw-player-targets',
            mc: {mcSocket: {send() {}}},
        });
        match.scenario = {gameZone: {cards: []}};
        const factory = new MatchFactory(match);
        const drawOrder = [];
        const refreshes = [];
        for (let index = 0; index < count; index++) {
            const player = match.createPlayer({
                name: `Player ${index}`,
                userId: `player-${index}`,
                initial: index === count - 1,
                superhero: factory.createSuperhero({
                    ...blackWidow.config,
                    cards: [],
                    precon: [],
                    obligation: undefined,
                    nemesis: [],
                }),
            });
            player.deck = {
                cards: Array.from({length: 4}, (_, cardIndex) => ({
                    id: `card-${index}-${cardIndex}`,
                    owner: player,
                })),
                async draw(drawCount) {
                    drawOrder.push(player.id);
                    return this.cards.splice(0, drawCount);
                },
            };
            player.hand.refresh = async () => refreshes.push(player.id);
        }
        const actor = match.players[0];
        match.currentPlayer = actor;
        const dialogs = [];
        match.openDialog = async dialog => {
            dialogs.push(dialog);
            assert.equal(dialog.dialogType, DIALOG_SELECT_TARGET);
            return {selected: dialog.data.cards.at(-1)};
        };
        return {actor, dialogs, drawOrder, match, refreshes};
    };
    const handIds = match => match.players.map(player =>
        player.hand.cards.map(card => card.id));

    test('ALL_PLAYERS draws for everybody in resolver order without a target dialog', async () => {
        const {actor, dialogs, drawOrder, match, refreshes} = createGame();
        const effect = new DrawEffect({match, target: TARGET_ALL_PLAYERS, count: 2});
        assert.equal(await effect.canRun({player: actor}), true);
        await effect.runEffect({player: actor, match});

        assert.deepEqual(effect.selectedTarget, match.players);
        assert.deepEqual(handIds(match), [
            ['card-0-0', 'card-0-1'],
            ['card-1-0', 'card-1-1'],
            ['card-2-0', 'card-2-1'],
        ]);
        assert.deepEqual(drawOrder, match.players.map(player => player.id));
        assert.deepEqual(refreshes, drawOrder);
        assert.deepEqual(dialogs, []);
    });

    test('ANY_PLAYER offers everybody but only the chosen player draws', async () => {
        const {actor, dialogs, drawOrder, match} = createGame();
        const effect = new DrawEffect({match, target: TARGET_ANY_PLAYER});
        await effect.runEffect({player: actor, match});

        assert.equal(dialogs.length, 1);
        assert.equal(dialogs[0].targetPlayer, actor.id);
        assert.deepEqual(dialogs[0].data.cards.map(card => card.id),
            match.players.map(player => player.id));
        assert.equal(effect.selectedTarget.id, match.players[2].id);
        assert.deepEqual(handIds(match), [[], [], ['card-2-0']]);
        assert.deepEqual(drawOrder, [match.players[2].id]);
    });

    for (const target of [TARGET_ALL_PLAYERS, TARGET_ANY_PLAYER]) {
        test(`${target} restricts the total player pool using ordinary and negative conditions`, async () => {
            const {actor, dialogs, match} = createGame(4);
            match.players[0].defeated = true;
            match.players[1].played = true;
            const effect = new DrawEffect({
                match,
                target,
                condition: {played: false, not: {defeated: true}},
            });
            assert.deepEqual(effect.getValidTarget({player: actor}),
                [match.players[2], match.players[3]]);
            await effect.runEffect({player: actor, match});

            assert.deepEqual(handIds(match), target === TARGET_ALL_PLAYERS ?
                [[], [], ['card-2-0'], ['card-3-0']] :
                [[], [], [], ['card-3-0']]);
            assert.equal(dialogs.length, target === TARGET_ALL_PLAYERS ? 0 : 1);
            if (dialogs.length) {
                assert.equal(dialogs[0].targetPlayer, actor.id);
                assert.deepEqual(dialogs[0].data.cards.map(card => card.id),
                    [match.players[2].id, match.players[3].id]);
            }
        });

        test(`${target} automatically selects the only player matching a nested condition`, async () => {
            const {actor, dialogs, match} = createGame();
            match.players[1].superhero.selectedSide = 1;
            const effect = new DrawEffect({
                match,
                target,
                condition: {'superhero.isHero': true},
            });
            await effect.runEffect({player: actor, match});
            assert.deepEqual(handIds(match), [[], ['card-1-0'], []]);
            assert.deepEqual(dialogs, []);
        });

        test(`${target} is unavailable when the condition excludes every player`, async () => {
            const {actor, dialogs, match} = createGame();
            const effect = new DrawEffect({
                match, target, condition: {defeated: true},
            });
            assert.deepEqual(effect.getValidTarget({player: actor}), []);
            assert.ok(!await effect.canRun({player: actor}));
            assert.deepEqual(handIds(match), [[], [], []]);
            assert.deepEqual(dialogs, []);
        });
    }

    test('aggregate conditions retain ties before ALL or ANY selection', async () => {
        for (const target of [TARGET_ALL_PLAYERS, TARGET_ANY_PLAYER]) {
            const {actor, dialogs, match} = createGame();
            match.players[0].score = 1;
            match.players[1].score = 2;
            match.players[2].score = 2;
            const effect = new DrawEffect({
                match, target, condition: {score: {operator: 'max'}},
            });
            await effect.runEffect({player: actor, match});
            assert.deepEqual(handIds(match), target === TARGET_ALL_PLAYERS ?
                [[], ['card-1-0'], ['card-2-0']] :
                [[], [], ['card-2-0']]);
            assert.equal(dialogs.length, target === TARGET_ALL_PLAYERS ? 0 : 1);
        }
    });

    test('ALL_PLAYERS supports a calculated draw count for each recipient', async () => {
        const {actor, match} = createGame(2);
        const effect = new DrawEffect({
            match,
            target: TARGET_ALL_PLAYERS,
            paramsCalc: {target: 'match.players', formula: CALC_COUNT},
        });
        await effect.runEffect({player: actor, match});
        assert.deepEqual(handIds(match), [
            ['card-0-0', 'card-0-1'],
            ['card-1-0', 'card-1-1'],
        ]);
    });

    test('a singular target still draws only for the acting player', async () => {
        const {actor, dialogs, match} = createGame();
        const effect = new DrawEffect({match, target: TARGET_YOU});
        await effect.runEffect({player: actor, match});
        assert.deepEqual(handIds(match), [['card-0-0'], [], []]);
        assert.deepEqual(dialogs, []);
    });
});
