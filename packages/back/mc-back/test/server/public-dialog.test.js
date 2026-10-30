import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {EVENTS} from 'mc-endpoints';
import {DIALOG_ACTIVATE, DIALOG_ENCOUNTERS_REVEAL} from 'mc-shared';
import {Engine} from '../../src/engine/engine.js';
import {EnemyAttackEffect} from '../../src/effects/enemy-attack-effect.js';
import {EnemySchemeEffect} from '../../src/effects/enemy-scheme-effect.js';
import {DialogSocket} from '../../src/server/socket/dialog-socket.js';

describe('Public dialogs with a single responsible player', () => {
    const createGame = () => {
        const players = [
            {id: 'player-1', userId: 'account-1', name: 'Same Name'},
            {id: 'player-2', userId: 'account-2', name: 'Same Name'},
        ];
        const sent = [];
        const match = {
            name: 'game',
            players,
            initialPlayer: players[0],
            getPlayer: id => players.find(player => player.id === id),
        };
        const socket = new DialogSocket({
            isMatchAvailable: () => true,
            send: (...args) => sent.push(args),
        });
        match.openDialog = params => socket.openDialog(match, params);
        const engine = Object.assign(new Engine(), {match});
        return {players, sent, match, socket, engine};
    };

    test('broadcasts the card but accepts only the authenticated responsible account', async () => {
        const {players, sent, socket, engine} = createGame();
        const pending = engine.openPublicDialog({
            dialogType: DIALOG_ENCOUNTERS_REVEAL,
            data: {card: {name: 'Agresión'}},
        }, players[1]);
        const [room, event, dialog] = sent[0];
        assert.equal(room, 'game');
        assert.equal(event, EVENTS.DIALOG.OPEN);
        assert.equal(dialog.showToAll, true);
        assert.equal(dialog.targetPlayer, 'player-2');
        assert.equal(dialog.targetPlayerName, 'Same Name');
        assert.equal(dialog.targetUserId, 'account-2');
        assert.deepEqual(dialog.data.card, {name: 'Agresión'});
        const response = {requestId: dialog.requestId, response: {closed: true}};
        assert.equal(socket.respond('game', {...response, userId: 'account-2'}, 'account-1'), false);
        assert.equal(socket.respond('other-game', response, 'account-2'), false);
        assert.equal(sent.length, 1);
        assert.equal(socket.pending.size, 1);
        assert.equal(socket.respond('game', response, 'account-2'), true);
        assert.deepEqual(await pending, {closed: true});
        assert.deepEqual(sent[1], ['game', EVENTS.DIALOG.COMPLETE, {requestId: dialog.requestId}]);
        assert.equal(socket.pending.size, 0);
        assert.equal(socket.respond('game', response, 'account-2'), false);
    });

    test('private setup dialogs expose seat ownership before snapshots and resolve same-account requests independently', async () => {
        const {players, sent, match, socket} = createGame();
        players[1].userId = players[0].userId;
        players[0].superhero = {mainName: 'Spider-Man'};
        players[1].superhero = {mainName: 'Iron Man'};
        const first = socket.openDialog(match, {
            isMulligan: true,
            targetPlayer: players[0].id,
            targetUserId: 'forged-owner',
        });
        const second = socket.openDialog(match, {
            isMulligan: true,
            targetPlayer: players[1].id,
        });
        const dialogs = sent.map(([, , dialog]) => dialog);
        assert.deepEqual(dialogs.map(dialog => [dialog.targetPlayer, dialog.targetUserId]), [
            ['player-1', 'account-1'], ['player-2', 'account-1'],
        ]);
        assert.deepEqual(dialogs.map(dialog => dialog.targetHeroName),
            ['Spider-Man', 'Iron Man']);
        assert.notEqual(dialogs[0].requestId, dialogs[1].requestId);
        assert.equal(socket.respond('game', {
            requestId: dialogs[0].requestId, response: {selected: ['first-card']},
        }, 'account-2'), false);
        assert.equal(socket.respond('game', {
            requestId: dialogs[0].requestId, response: {selected: ['first-card']},
        }, 'account-1'), true);
        assert.deepEqual(await first, {selected: ['first-card']});
        assert.equal(socket.pending.size, 1);
        assert.equal(socket.pending.has(dialogs[1].requestId), true);
        assert.equal(socket.respond('game', {
            requestId: dialogs[1].requestId, response: {selected: ['second-card']},
        }, 'account-1'), true);
        assert.deepEqual(await second, {selected: ['second-card']});
        assert.equal(socket.pending.size, 0);
    });

    test('setup defaults to the initial player, preserving identity across reconnection', async () => {
        const {sent, socket, engine} = createGame();
        const pending = engine.openPublicDialog({dialogType: DIALOG_ENCOUNTERS_REVEAL});
        const dialog = sent[0][2];
        assert.equal(dialog.targetPlayer, 'player-1');
        const replay = [];
        socket.resendPending('game', {emit: (...args) => replay.push(args)});
        assert.deepEqual(replay, [[EVENTS.DIALOG.OPEN, dialog]]);
        assert.equal(socket.respond('game', {requestId: dialog.requestId}, 'account-1'), true);
        await pending;
    });

    test('rejects public dialogs without a valid responsible player', async () => {
        const {match, socket, sent} = createGame();
        await assert.rejects(socket.openDialog(match, {showToAll: true}), /jugador responsable/u);
        await assert.rejects(socket.openDialog(match, {
            showToAll: true,
            targetPlayer: 'missing',
        }), /jugador destinatario/u);
        assert.equal(sent.length, 0);
        assert.equal(socket.pending.size, 0);
    });

    test('actual attack and scheme dialogs accept only the affected player, not the initiating player', async () => {
        for (const kind of ['player', 'hero', 'ally', 'multiple', 'scheme', 'minion-scheme']) {
            const {players, match, socket, sent} = createGame();
            players.forEach(player => { player.isPlayer = true; });
            const character = (name, owner) => ({
                name,
                owner,
                async getEffectiveStats() { return {}; },
                async getAttackValue() { return 2; },
                async getSchemeValue() { return 1; },
                toObj() { return {name: this.name}; },
            });
            const hero = character('Affected hero', players[1]);
            players[1].superhero = {currentSide: hero, ...hero};
            const ally = character('Affected ally', players[1]);
            const enemy = character('Enemy');
            if (kind === 'minion-scheme') {
                enemy.isMinion = true;
                enemy.engaged = players[1];
            }
            const isScheme = kind.includes('scheme');
            const selectedTarget = isScheme ? character('Main scheme') :
                kind === 'player' ? players[1] :
                kind === 'ally' ? ally : kind === 'multiple' ? [hero, ally] : hero;
            const EffectClass = isScheme ? EnemySchemeEffect : EnemyAttackEffect;
            const effect = new EffectClass({enemy, match, selectedTarget});
            let notifyOpened;
            const opened = new Promise(resolve => { notifyOpened = resolve; });
            socket.mcSocket.send = (...args) => {
                sent.push(args);
                if (args[1] === EVENTS.DIALOG.OPEN) {
                    notifyOpened(args[2]);
                }
            };
            const params = await effect.resolveParams({
                player: kind === 'scheme' ? players[1] : players[0],
            });
            const preparing = effect.prepare(params);
            const dialog = await Promise.race([opened, preparing]);
            assert.equal(dialog.dialogType, DIALOG_ACTIVATE, kind);
            assert.equal(dialog.showToAll, true, kind);
            assert.equal(dialog.targetPlayer, players[1].id, kind);
            assert.equal(dialog.data.target.name,
                kind === 'ally' ? 'Affected ally' : 'Affected hero', kind);
            assert.equal(socket.respond('game', {requestId: dialog.requestId}, 'account-1'), false, kind);
            assert.equal(socket.pending.size, 1, kind);
            assert.equal(socket.respond('game', {requestId: dialog.requestId}, 'account-2'), true, kind);
            await preparing;
            assert.deepEqual(sent.at(-1),
                ['game', EVENTS.DIALOG.COMPLETE, {requestId: dialog.requestId}], kind);
        }
    });
});
