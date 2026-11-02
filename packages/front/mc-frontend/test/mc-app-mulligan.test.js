import assert from 'node:assert/strict';
import {describe, test} from 'node:test';
import {fileURLToPath} from 'node:url';
import {createServer} from 'vite';
import {Dialog} from '../src/components/api/dialog.js';
import {PLACE_DISCARD_PILE} from 'mc-shared';

globalThis.HTMLElement ??= class {};
const elements = new Map();
globalThis.window ??= {};
globalThis.window.customElements ??= {
    define: (name, element) => elements.set(name, element),
    get: name => elements.get(name),
};
globalThis.customElements ??= globalThis.window.customElements;

const server = await createServer({
    configFile: false,
    root: fileURLToPath(new URL('../', import.meta.url)),
    server: {middlewareMode: true, hmr: false},
    ssr: {noExternal: ['lit-element-router']},
});
try {
    await server.ssrLoadModule('/src/components/core/mc-app/mc-app.js');
} finally {
    await server.close();
}
const McApp = window.customElements.get('mc-app');

describe('app match controls and mulligan lifecycle', () => {
    test('game dialogs, waiting dialogs and alerts disable opening and closing animations', () => {
        const app = Object.assign(Object.create(McApp.prototype), {
            dialog: null, mulliganWaiting: false, dialogQueue: [],
        });
        const McAlert = window.customElements.get('mc-alert');
        const alert = Object.assign(Object.create(McAlert.prototype), {
            msg: 'Aviso', open: true,
        });
        for (const template of [
            app.renderDialogElement(null, 'dialog', true),
            app.renderMulliganWaitingDialog(),
            alert.render(),
        ]) {
            const quickIndex = template.strings.findIndex(part => part.endsWith('.quick="'));
            assert.notEqual(quickIndex, -1);
            assert.equal(template.values[quickIndex], true);
        }
    });

    const templateText = value => {
        if (Array.isArray(value)) {
            return value.map(templateText).join('');
        }
        if (typeof value === 'string' || typeof value === 'number') {
            return String(value);
        }
        if (value?.strings && value?.values) {
            return value.strings.reduce((text, part, index) =>
                text + part + templateText(value.values[index]), '');
        }
        return '';
    };
    const getBinding = (template, name) => {
        const index = template.strings.findIndex(part =>
            part.endsWith(`?${name}="`));

        return index === -1 ? undefined : template.values[index];
    };
    const createApp = (overrides = {}) => Object.assign(Object.create(McApp.prototype), {
        api: {match: 'partida'},
        match: null,
        pendingResumeMatch: 'partida',
        mulliganWaiting: true,
        waitingForResponse: 'Esperando al resto...',
        waitingDialogRequestId: 'mulligan-request',
        dialogQueue: [],
        tableConsultationMode: false,
        tableViewDialog: null,
        completedDialogRequestIds: new Set(),
        ...overrides,
    });
    const createStatusApp = (overrides = {}) => createApp({
        route: 'match',
        user: {id: 'local', name: 'Local'},
        player: 'local',
        connectionState: 'connected',
        mulliganWaiting: false,
        waitingForResponse: '',
        pendingResumeMatch: '',
        dialog: null,
        match: {
            name: 'partida',
            initialized: true,
            playing: true,
            phase: 'players',
            currentTurnPlayer: 'local',
            players: [
                {id: 'local', userId: 'local', name: 'Jugador', superhero: {name: 'Capitán América'}},
                {id: 'guest', userId: 'guest', name: 'Jugador', superhero: {name: 'Capitana Marvel'}},
            ],
        },
        ...overrides,
    });

    test('dialog board follows a controlled target hero only while its dialog is open', () => {
        const app = createStatusApp({player: 'seat-a'});
        app.match.players = [
            {id: 'seat-a', userId: 'local', superhero: {name: 'Hero A'}},
            {id: 'seat-b', userId: 'local', superhero: {name: 'Hero B'}},
            {id: 'guest', userId: 'guest', superhero: {name: 'Hero C'}},
        ];

        app.openDialog({
            dialogType: 'select-target',
            targetPlayer: 'seat-b',
            targetUserId: 'local',
        });
        assert.equal(app.dialogBoardPlayerId, 'seat-b');
        assert.equal(app.player, 'seat-a');
        app.finishDialog(app.dialog);
        assert.equal(app.dialogBoardPlayerId, '');

        app.openDialog({
            dialogType: 'select-target',
            targetPlayer: 'guest',
            targetUserId: 'guest',
            showToAll: true,
        });
        assert.equal(app.dialogBoardPlayerId, '');
    });

    test('hides a pending dialog for table consultation and restores the current queued choice', () => {
        const app = createStatusApp({player: 'seat-a'});
        app.match.players = [
            {id: 'seat-a', userId: 'local', superhero: {name: 'Hero A'}},
            {id: 'seat-b', userId: 'local', superhero: {name: 'Hero B'}},
        ];
        app.match.currentTurnPlayer = 'seat-b';
        const current = {
            dialogType: 'select-target',
            requestId: 'current-choice',
            targetPlayer: 'seat-b',
            targetUserId: 'local',
        };
        const next = {dialogType: 'confirm', requestId: 'next-choice'};
        app.dialog = current;
        app.dialogQueue = [next];

        app.handleViewTable();

        assert.equal(app.tableConsultationMode, true);
        assert.equal(app.player, 'seat-b');
        assert.strictEqual(app.dialog, current);
        const toolbar = templateText(app.renderAccountBar());
        assert.match(toolbar, /<md-filled-button\s+class="return-dialog"/u);
        assert.ok(toolbar.indexOf('Volver al diálogo') <
            toolbar.indexOf('class="match-status"'));
        assert.ok(toolbar.indexOf('class="match-status"') <
            toolbar.indexOf('Tu turno'));
        assert.ok(toolbar.indexOf('Tu turno') <
            toolbar.indexOf('class="account-menu"'));
        assert.doesNotMatch(toolbar, /Esperando tu respuesta/u);
        assert.equal(app.matchStatusText, 'Tu turno');
        app.tableConsultationMode = false;
        assert.equal(app.matchStatusText, 'Esperando tu respuesta...');
        app.tableConsultationMode = true;
        assert.equal(getBinding(app.renderDialog().values[0], 'open'), false);

        app.handleDialogComplete({requestId: 'current-choice'});

        assert.strictEqual(app.dialog, next);
        assert.equal(app.tableConsultationMode, true);

        app.handleReturnToDialog();

        assert.equal(app.tableConsultationMode, false);
        assert.strictEqual(app.dialog, next);
        assert.equal(getBinding(app.renderDialog().values[0], 'open'), true);
    });

    test('discard and tucked-card inspection dialogs are read-only and preserve the pending choice', () => {
        const app = createStatusApp({
            player: 'local',
            tableConsultationMode: true,
        });
        const pending = {dialogType: 'select-target', requestId: 'pending'};
        app.dialog = pending;

        app.handleViewTuckedCards({
            detail: {
                card: {name: 'Anfitrión'},
                cards: [{
                    id: 'tucked-card',
                    playable: true,
                    playFrom: ['tucked'],
                }],
            },
        });
        assert.strictEqual(app.dialog, pending);
        assert.equal(app.tableViewDialog.viewOnly, true);
        assert.equal(app.tableViewDialog.data.playFromPlace, null);
        app.handleTableViewDialogClose();
        assert.equal(app.tableConsultationMode, true);

        app.handleViewDiscard({
            detail: {
                cards: [{id: 'discard-card', playable: true}],
                title: 'Descarte',
                isPlayerDeck: true,
            },
        });
        assert.strictEqual(app.dialog, pending);
        assert.equal(app.tableViewDialog.viewOnly, true);
        assert.equal(app.tableViewDialog.data.playFromPlace, null);
        assert.equal(app.tableViewDialog.subtitle, 'Consulta las cartas del descarte.');
    });

    test('server dialog answers remain bound to the requested hero across queued dialogs and selection changes', async () => {
        const requests = [];
        let receiveDialog;
        const app = createStatusApp({player: 'seat-a'});
        app.match.players = [
            {id: 'seat-a', userId: 'local', superhero: {name: 'Hero A'}},
            {id: 'seat-b', userId: 'local', superhero: {name: 'Hero B'}},
        ];
        new Dialog({
            listen: ({callback}) => { receiveDialog = callback; },
            send: async request => requests.push(request),
        }).listenDialog(params => app.openDialog(params));
        for (const seat of ['seat-b', 'seat-a']) {
            receiveDialog({
                match: 'partida', requestId: `decision-${seat}`,
                targetPlayer: seat, targetUserId: 'local',
            });
        }
        assert.equal(app.dialog.initiatingPlayer, 'seat-b');
        app.player = 'seat-b';
        await app.handleDialogOk({detail: {selected: 'hero-b-target'}});
        assert.equal(app.dialog.initiatingPlayer, 'seat-a');
        await app.handleCancelDialog();
        assert.deepEqual(requests.map(request => request.params), [
            {
                match: 'partida', requestId: 'decision-seat-b',
                response: {selected: 'hero-b-target'},
            },
            {match: 'partida', requestId: 'decision-seat-a', response: undefined},
        ]);
        assert.equal(app.player, 'seat-b');
        assert.equal(app.dialog, null);
    });

    test('an action menu yields to player target selection before the action request finishes', async () => {
        for (const sameAccount of [false, true]) {
            const app = createStatusApp({player: 'seat-a'});
            app.match.players = [
                {id: 'seat-a', userId: 'local', superhero: {name: 'Carol Danvers'}},
                {id: 'seat-b', userId: sameAccount ? 'local' : 'guest', superhero: {name: 'Steve Rogers'}},
            ];
            let receiveDialog;
            let finishAction;
            let selected;
            const actionDone = new Promise(resolve => { finishAction = resolve; });
            new Dialog({
                listen: ({callback}) => { receiveDialog = callback; },
                send: async ({params}) => {
                    selected = params.response.selected;
                    finishAction();
                },
            }).listenDialog(params => app.openDialog(params));
            app.handleChangeMenu({detail: {
                card: {name: 'Carol Danvers'},
                menuOptions: [{name: 'Comandante'}],
                callback: async () => {
                    assert.equal(app.dialog, null, 'the menu closes before executing the action');
                    receiveDialog({
                        dialogType: 'select-target',
                        match: 'partida',
                        requestId: 'choose-beneficiary',
                        targetPlayer: 'seat-a',
                        targetUserId: 'local',
                        data: {cards: app.match.players.map(player => ({
                            id: player.id, name: player.superhero.name, isPlayer: true,
                        }))},
                    });
                    await actionDone;
                },
            }});
            const actionResponse = app.handleDialogOk({detail: {selected: {name: 'Comandante'}}});
            assert.equal(app.dialog.dialogType, 'select-target');
            assert.equal(app.dialog.readOnly, false);
            assert.equal(app.dialog.initiatingPlayer, 'seat-a');
            assert.equal(app.dialog.targetPlayerName, 'Carol Danvers');
            assert.deepEqual(app.dialog.data.cards.map(card => card.id), ['seat-a', 'seat-b']);
            assert.equal(app.dialogQueue.length, 0);
            if (sameAccount) {
                app.player = 'seat-b';
            }
            await app.handleDialogOk({detail: {selected: app.dialog.data.cards[1]}});
            await actionResponse;
            assert.equal(selected.id, 'seat-b');
            assert.equal(app.dialog, null);
            assert.equal(app.dialogQueue.length, 0);
        }
    });

    test('local confirmations and card-selection dialogs yield to nested decisions, including cancellation', async () => {
        for (const cancel of [false, true]) {
            for (const dialogType of ['confirm', 'reveal-cards']) {
                const app = createStatusApp();
                let finishAction;
                const actionDone = new Promise(resolve => { finishAction = resolve; });
                app.openDialog({
                    dialogType,
                    callback: async () => {
                        assert.equal(app.dialog, null);
                        app.openDialog({
                            dialogType: 'select-target', requestId: 'next',
                            targetPlayer: 'local',
                            callback: async () => { finishAction(); },
                        });
                        await actionDone;
                    },
                });
                const responding = cancel ?
                    app.handleCancelDialog() :
                    app.handleDialogOk({detail: {}});
                assert.equal(app.dialog.requestId, 'next');
                await app.handleDialogOk({detail: {}});
                await responding;
                assert.equal(app.dialog, null);
            }
        }
    });

    test('a rejected local action never closes a subsequent server decision', async () => {
        const app = createStatusApp();
        app.openDialog({
            dialogType: 'list',
            callback: async () => {
                app.openDialog({dialogType: 'select-target', requestId: 'next', targetPlayer: 'local'});
                throw new Error('Action failed');
            },
        });
        await app.handleDialogOk({detail: {}});
        assert.equal(app.alert.msg, 'Action failed');
        assert.equal(app.dialog.requestId, 'next');
        assert.equal(app.completedDialogRequestIds.has('next'), false);
    });

    test('public encounters are visible to observers without response controls', async () => {
        const app = createStatusApp();
        let responses = 0;
        app.openDialog({
            dialogType: 'encounters-reveal',
            targetPlayer: 'guest',
            targetPlayerName: 'Capitana Marvel',
            showToAll: true,
            requestId: 'partida:1',
            showCancel: true,
            callback: () => responses++,
            data: {card: {name: 'Agresión'}},
        });
        assert.equal(app.dialog.readOnly, true);
        assert.equal(app.dialog.targetPlayerName, 'Capitana Marvel');
        assert.equal(app.dialog.requestId, 'partida:1');
        assert.equal(app.dialog.data.card.name, 'Agresión');
        assert.equal(app.dialog.callback, undefined);
        assert.equal(app.dialog.showCancel, false);
        assert.equal(app.dialog.hideOk, true);
        assert.equal('hand' in app.dialog, false);
        assert.match(app.waitingForResponse, /Capitana Marvel/u);
        await app.handleDialogOk({detail: {}});
        await app.handleCancelDialog();
        assert.equal(responses, 0);
        assert.ok(app.dialog);
        const template = app.renderDialogElement(app.dialog, 'dialog', true);
        const cancel = template.values.find(value => typeof value === 'function' &&
            !value.name.startsWith('bound'));
        let prevented = false;
        cancel({preventDefault: () => { prevented = true; }});
        assert.equal(prevented, true);
    });

    test('public encounter controls remain available only to the responsible player', async () => {
        const app = createStatusApp({player: 'guest', user: {id: 'guest'}});
        let responses = 0;
        const callback = async () => { responses++; };
        app.openDialog({
            targetPlayer: 'guest',
            targetPlayerName: 'Capitana Marvel',
            showToAll: true,
            requestId: 'partida:1',
            callback,
        });
        assert.equal(app.dialog.readOnly, false);
        assert.equal(app.dialog.hideOk, undefined);
        assert.equal(app.dialog.callback, callback);
        assert.equal(app.waitingForResponse, '');
        await app.handleDialogOk({detail: {}});
        assert.equal(responses, 1);
        assert.equal(app.dialog, null);
    });

    test('private selections are still hidden from every other player', () => {
        const app = createStatusApp();
        app.openDialog({
            dialogType: 'select-target',
            targetPlayer: 'guest',
            requestId: 'partida:private',
        });
        assert.equal(app.dialog, null);
        assert.equal(app.waitingDialogRequestId, 'partida:private');
    });

    test('activation dialogs are visible to everyone but can only be closed by the affected player', async () => {
        const actor = createStatusApp({player: 'guest', user: {id: 'guest'}});
        const observer = createStatusApp();
        const requestId = 'partida:activation';
        let responses = 0;
        const callback = async () => {
            responses++;
            for (const app of [actor, observer]) {
                app.handleDialogComplete({requestId});
            }
        };
        for (const app of [actor, observer]) {
            app.openDialog({
                dialogType: 'activate',
                targetPlayer: 'guest',
                showToAll: true,
                requestId,
                callback,
                data: {character: {name: 'Rino'}, target: {name: 'Capitana Marvel'}},
            });
        }
        assert.equal(actor.dialog.readOnly, false);
        assert.equal(observer.dialog.readOnly, true);
        assert.equal(observer.dialog.data.target.name, 'Capitana Marvel');
        await observer.handleDialogOk({detail: {}});
        await observer.handleCancelDialog();
        assert.equal(responses, 0);
        assert.ok(actor.dialog);
        assert.ok(observer.dialog);
        await actor.handleDialogOk({detail: {}});
        assert.equal(responses, 1);
        assert.equal(actor.dialog, null);
        assert.equal(observer.dialog, null);
        assert.equal(observer.waitingForResponse, '');
    });

    test('selects only owned seats, preserves selection across snapshots and never changes the turn', () => {
        const app = createStatusApp();
        const players = [
            {id: 'seat-a', userId: 'local', superhero: {name: 'Hero A'}},
            {id: 'seat-b', userId: 'local', superhero: {name: 'Hero B'}},
            {id: 'seat-c', userId: 'guest', superhero: {name: 'Hero C'}},
        ];
        app.handleSocketMatch({...app.match, players, currentTurnPlayer: 'seat-a'});
        assert.equal(app.player, 'seat-a', 'legacy account selection is normalized');
        app.handleSelectControlledPlayer({detail: {player: 'seat-b'}});
        assert.equal(app.player, 'seat-b');
        assert.equal(app.match.currentTurnPlayer, 'seat-a');
        app.handleSelectControlledPlayer({detail: {player: 'seat-c'}});
        app.handleSelectControlledPlayer({detail: {player: 'missing'}});
        assert.equal(app.player, 'seat-b');
        app.handleSocketMatch({...app.match, currentTurnPlayer: 'seat-c'});
        assert.equal(app.player, 'seat-b');
        app.handleMatchChanged({detail: {match: {...app.match, currentTurnPlayer: 'seat-a'}}});
        assert.equal(app.player, 'seat-b');
        app.appReady = true;
        app.renderRemote = (_name, element) => element;
        assert.match(templateText(app.render()), /@select-controlled-player=/u);
    });

    test('starting the match selects the owned initial hero once and then preserves manual selection', () => {
        for (const socketRefresh of [false, true]) {
            const app = createStatusApp({player: 'seat-a'});
            app.match = {...app.match, initialized: false, players: [
                {id: 'seat-a', userId: 'local', superhero: {name: 'Hero A'}},
                {id: 'seat-b', userId: 'local', initial: true, superhero: {name: 'Hero B'}},
            ]};
            const refresh = match => socketRefresh ?
                app.handleSocketMatch(match) :
                app.handleMatchChanged({detail: {match}});
            refresh({...app.match, initialized: true, currentTurnPlayer: 'seat-b'});
            assert.equal(app.player, 'seat-b');
            assert.equal(app.match.currentTurnPlayer, 'seat-b');
            app.handleSelectControlledPlayer({detail: {player: 'seat-a'}});
            refresh({...app.match});
            assert.equal(app.player, 'seat-a', 'ordinary updates never undo a manual selection');
        }
    });

    test('the first snapshot defaults to the initial hero only when owned by this account', () => {
        for (const ownInitialHero of [false, true]) {
            const app = createStatusApp({match: null, player: 'local'});
            app.handleSocketMatch({
                name: 'partida', initialized: true, phase: 'players', playing: true,
                currentTurnPlayer: 'seat-b', players: [
                    {id: 'seat-a', userId: 'local', superhero: {name: 'Hero A'}},
                    {id: 'seat-b', userId: ownInitialHero ? 'local' : 'guest',
                        initial: true, superhero: {name: 'Hero B'}},
                ],
            });
            assert.equal(app.player, ownInitialHero ? 'seat-b' : 'seat-a');
        }
    });

    test('each players phase selects the first surviving owned hero in initial-player order only once', () => {
        for (const socketRefresh of [false, true]) {
            for (const ownInitialHero of [false, true]) {
                const app = createStatusApp({player: ownInitialHero ? 'seat-c' : 'seat-a'});
                app.match = {...app.match, phase: 'villain', currentTurnPlayer: null, players: [
                    {id: 'seat-a', userId: 'local', initial: ownInitialHero, superhero: {name: 'Hero A'}},
                    {id: 'seat-b', userId: 'guest', initial: !ownInitialHero, superhero: {name: 'Hero B'}},
                    {id: 'seat-c', userId: 'local', superhero: {name: 'Hero C'}},
                ]};
                const refresh = match => socketRefresh ?
                    app.handleSocketMatch(match) :
                    app.handleMatchChanged({detail: {match}});
                const initialId = ownInitialHero ? 'seat-a' : 'seat-b';
                const expectedId = ownInitialHero ? 'seat-a' : 'seat-c';
                for (let round = 0; round < 2; round++) {
                    refresh({...app.match, phase: 'players', currentTurnPlayer: initialId});
                    assert.equal(app.player, expectedId);
                    assert.equal(app.match.currentTurnPlayer, initialId);
                    const manualId = expectedId === 'seat-a' ? 'seat-c' : 'seat-a';
                    app.handleSelectControlledPlayer({detail: {player: manualId}});
                    refresh({...app.match});
                    assert.equal(app.player, manualId);
                    refresh({...app.match, phase: 'villain', currentTurnPlayer: null});
                    assert.equal(app.player, manualId);
                }
                const players = app.match.players.map(player => ({
                    ...player, defeated: player.id === expectedId,
                }));
                refresh({...app.match, phase: 'players', currentTurnPlayer: initialId, players});
                assert.equal(app.player, expectedId === 'seat-a' ? 'seat-c' : 'seat-a');
            }
        }
    });

    test('finishing a turn selects the next owned pending hero even with another account between them', () => {
        for (const socketRefresh of [false, true]) {
            const app = createStatusApp({player: 'seat-a'});
            app.match = {...app.match, currentTurnPlayer: 'seat-a', players: [
                {id: 'seat-a', userId: 'local', initial: true, superhero: {name: 'Hero A'}},
                {id: 'seat-b', userId: 'guest', superhero: {name: 'Hero B'}},
                {id: 'seat-c', userId: 'local', superhero: {name: 'Hero C'}},
            ]};
            const refresh = match => socketRefresh ?
                app.handleSocketMatch(match) :
                app.handleMatchChanged({detail: {match}});
            refresh({...app.match, currentTurnPlayer: null});
            assert.equal(app.player, 'seat-c');
            refresh({...app.match, currentTurnPlayer: 'seat-b'});
            assert.equal(app.player, 'seat-c');
            assert.equal(app.match.currentTurnPlayer, 'seat-b', 'the view does not advance the actual turn');
            refresh({...app.match, currentTurnPlayer: 'seat-c'});
            refresh({...app.match, currentTurnPlayer: null});
            assert.equal(app.player, 'seat-c', 'all owned turns are finished; do not wrap to Hero A');
            refresh({...app.match, phase: 'villain'});
            assert.equal(app.player, 'seat-c');
        }
    });

    test('automatic selection uses initial-player order and skips defeated heroes', () => {
        const app = createStatusApp({player: 'seat-c'});
        app.match = {...app.match, currentTurnPlayer: 'seat-c', players: [
            {id: 'seat-a', userId: 'local', superhero: {name: 'Hero A'}},
            {id: 'seat-b', userId: 'guest', superhero: {name: 'Hero B'}},
            {id: 'seat-c', userId: 'local', initial: true, superhero: {name: 'Hero C'}},
            {id: 'seat-d', userId: 'local', defeated: true, superhero: {name: 'Hero D'}},
        ]};
        app.handleSocketMatch({...app.match, currentTurnPlayer: null});
        assert.equal(app.player, 'seat-a');
        app.handleSocketMatch({...app.match, currentTurnPlayer: 'seat-a'});
        app.handleSocketMatch({...app.match, currentTurnPlayer: null});
        assert.equal(app.player, 'seat-a', 'the initial hero already finished its turn');
    });

    test('a later snapshot never selects an owned hero whose turn has already passed', () => {
        const app = createStatusApp({player: 'seat-a'});
        app.match = {...app.match, currentTurnPlayer: 'seat-a', players: [
            {id: 'seat-a', userId: 'local', initial: true, superhero: {name: 'Hero A'}},
            {id: 'seat-b', userId: 'local', superhero: {name: 'Hero B'}},
            {id: 'seat-c', userId: 'local', superhero: {name: 'Hero C'}},
        ]};
        app.handleSocketMatch({...app.match, currentTurnPlayer: 'seat-c'});
        assert.equal(app.player, 'seat-c');
    });

    test('an unselected owned hero may answer private and public decisions without switching views', async () => {
        for (const showToAll of [false, true]) {
            const app = createStatusApp();
            app.match.players.push({
                id: 'seat-b', userId: 'local', superhero: {name: 'Hero B'},
            });
            let responses = 0;
            app.openDialog({
                dialogType: 'select-target',
                targetPlayer: 'seat-b',
                showToAll,
                requestId: 'decision-b',
                callback: async () => { responses++; },
            });
            assert.equal(app.dialog.readOnly, false);
            assert.equal(app.dialog.initiatingPlayer, 'seat-b');
            assert.equal(app.dialog.targetPlayerName, 'Hero B');
            assert.doesNotMatch(templateText(app.renderDialog()), /dialog-responsible-player/u);
            assert.equal('hand' in app.dialog, false);
            await app.handleDialogOk({detail: {}});
            assert.equal(responses, 1);
            assert.equal(app.player, 'local');
        }
    });

    test('account authorization cannot be bypassed by the selected seat or a mismatched payload owner', () => {
        const app = createStatusApp({player: 'guest'});
        app.openDialog({
            targetPlayer: 'guest',
            targetUserId: 'local',
            showToAll: true,
            callback: () => assert.fail('No foreign decision allowed'),
        });
        assert.equal(app.dialog.readOnly, true);
        assert.equal(app.dialog.callback, undefined);
        const setupApp = createStatusApp({match: null});
        setupApp.openDialog({targetPlayer: 'seat-b', targetUserId: 'guest', isMulligan: true});
        assert.equal(setupApp.dialog, null);
        setupApp.openDialog({targetPlayer: 'unknown'});
        assert.equal(setupApp.dialog, null);
    });

    test('queues both owned mulligans before a snapshot and drains safely across chained acknowledgements', async () => {
        const app = createStatusApp({match: null});
        const responses = [];
        let acknowledgeFirst;
        for (const [seat, hero] of [['seat-a', 'Hero A'], ['seat-b', 'Hero B']]) {
            app.openDialog({
                targetPlayer: seat,
                targetUserId: 'local',
                targetPlayerName: `Local (${seat})`,
                targetHeroName: hero,
                isMulligan: true,
                closeOnResponse: true,
                requestId: seat,
                callback: response => {
                    responses.push([seat, response]);
                    return seat === 'seat-a' ?
                        new Promise(resolve => { acknowledgeFirst = resolve; }) : Promise.resolve();
                },
            });
        }
        app.openDialog({
            targetPlayer: 'seat-c', targetUserId: 'guest',
            isMulligan: true, requestId: 'foreign',
        });
        assert.equal(app.dialog.requestId, 'seat-a');
        assert.equal(app.dialog.targetPlayerName, 'Hero A');
        assert.equal(app.dialogQueue.length, 1);
        assert.equal(app.waitingForResponse, '');
        app.openDialog({targetPlayer: 'seat-b', targetUserId: 'local', requestId: 'seat-b'});
        assert.equal(app.dialogQueue.length, 1, 'replayed request is not queued twice');
        const responding = app.handleDialogOk({detail: {selected: ['card-a']}});
        assert.equal(app.dialog.requestId, 'seat-b');
        assert.equal(app.dialog.targetPlayerName, 'Hero B');
        assert.equal(app.matchStatusText, 'Elige tu mulligan');
        const template = app.renderMulliganWaitingDialog();
        const openIndex = template.strings.findIndex(part => part.includes('.open="'));
        assert.equal(template.values[openIndex], false);
        app.handleDialogComplete({requestId: 'seat-a'});
        acknowledgeFirst();
        await responding;
        assert.equal(app.dialog.requestId, 'seat-b');
        await app.handleDialogOk({detail: {selected: ['card-b']}});
        assert.deepEqual(responses, [
            ['seat-a', {selected: ['card-a']}], ['seat-b', {selected: ['card-b']}],
        ]);
        assert.equal(app.dialog, null);
        assert.equal(app.dialogQueue.length, 0);
        app.handleMulliganComplete({match: 'partida'});
        assert.equal(app.mulliganWaiting, false);
        app.handleDialogComplete({requestId: 'seat-a'});
        assert.equal(app.dialog, null);
    });

    test('errors drain the queue without removing the next own mulligan or hiding its error', async () => {
        for (const cancel of [false, true]) {
            const app = createStatusApp({match: null});
            const errors = [];
            app.showAlert = message => errors.push(message);
            app.openDialog({
                targetPlayer: 'seat-a', targetUserId: 'local', isMulligan: true,
                requestId: 'first',
                callback: async () => { throw new Error('Response rejected'); },
            });
            app.openDialog({
                targetPlayer: 'seat-b', targetUserId: 'local', isMulligan: true,
                requestId: 'second', callback: async () => {},
            });
            if (cancel) {
                await app.handleCancelDialog();
            } else {
                await app.handleDialogOk({detail: {}});
            }
            assert.deepEqual(errors, ['Response rejected']);
            assert.equal(app.dialog.requestId, 'second');
            assert.equal(app.hasPendingOwnMulligan, true);
            app.handleDialogComplete({requestId: 'first'});
            assert.equal(app.dialog.requestId, 'second');
            await app.handleDialogOk({detail: {}});
            assert.equal(app.dialog, null);
            assert.equal(app.dialogQueue.length, 0);
        }
    });

    test('completion of a queued request removes only that request', () => {
        const app = createStatusApp();
        for (const requestId of ['first', 'second', 'third']) {
            app.openDialog({targetPlayer: 'local', requestId});
        }
        app.handleDialogComplete({requestId: 'second'});
        assert.equal(app.dialog.requestId, 'first');
        assert.deepEqual(app.dialogQueue.map(dialog => dialog.requestId), ['third']);
        app.handleDialogComplete({requestId: 'first'});
        assert.equal(app.dialog.requestId, 'third');
        app.handleDialogComplete({requestId: 'third'});
        assert.equal(app.dialog, null);
    });

    test('replays may retry a rejected response, but cannot duplicate an in-flight response', async () => {
        const app = createStatusApp();
        let rejectResponse;
        const request = {
            targetPlayer: 'local', requestId: 'retry', closeOnResponse: true,
            callback: () => new Promise((_resolve, reject) => { rejectResponse = reject; }),
        };
        app.openDialog(request);
        const responding = app.handleDialogOk({detail: {}});
        app.openDialog(request);
        assert.equal(app.dialog, null, 'an in-flight replay is ignored');
        rejectResponse(new Error('Connection lost'));
        await responding;
        assert.equal(app.alert.msg, 'Connection lost');
        app.openDialog({...request, callback: async () => {}});
        assert.equal(app.dialog.requestId, 'retry');
        await app.handleDialogOk({detail: {}});
        app.openDialog(request);
        assert.equal(app.dialog, null, 'an acknowledged request stays completed');
    });

    test('discard and tucked-card callbacks retain the initiating seat when the view switches', async () => {
        for (const tucked of [false, true]) {
            const app = createStatusApp({player: 'seat-a'});
            app.match.players = [
                {id: 'seat-a', userId: 'local', superhero: {name: 'Hero A'}},
                {id: 'seat-b', userId: 'local', superhero: {name: 'Hero B'}},
            ];
            const calls = [];
            app.api.post = async ({params}) => calls.push(params);
            const card = {id: 'card-a', playable: true, playFrom: [PLACE_DISCARD_PILE]};
            if (tucked) {
                app.handleViewTuckedCards({detail: {card: {name: 'Host'}, cards: [card]}});
            } else {
                app.handleViewDiscard({detail: {cards: [card], title: 'Discard', isPlayerDeck: true}});
            }
            assert.equal(app.dialog.initiatingPlayer, 'seat-a');
            app.player = 'seat-b';
            await app.handleDialogOk({detail: {selected: card}});
            assert.deepEqual(calls, [{player: 'seat-a', cardId: 'card-a'}]);
            assert.equal(app.player, 'seat-b');
        }
    });

    test('matching completion closes the public encounter for actor and observer', () => {
        for (const player of ['local', 'guest']) {
            const app = createStatusApp({player});
            app.openDialog({
                targetPlayer: 'guest',
                showToAll: true,
                requestId: 'partida:1',
            });
            app.handleDialogComplete({requestId: 'other:1'});
            assert.ok(app.dialog);
            app.handleDialogComplete();
            assert.ok(app.dialog);
            app.handleDialogComplete({requestId: 'partida:1'});
            assert.equal(app.dialog, null);
            assert.equal(app.waitingForResponse, '');
            assert.equal(app.waitingDialogRequestId, '');
        }
    });

    test('completion and the next dialog before acknowledgement never close the next dialog', async () => {
        const app = createStatusApp();
        let acknowledge;
        app.openDialog({
            targetPlayer: 'local',
            showToAll: true,
            requestId: 'partida:1',
            callback: () => new Promise(resolve => { acknowledge = resolve; }),
        });
        const responding = app.handleDialogOk({detail: {}});
        app.handleDialogComplete({requestId: 'partida:1'});
        app.openDialog({
            targetPlayer: 'guest',
            showToAll: true,
            requestId: 'partida:2',
        });
        acknowledge();
        await responding;
        assert.equal(app.dialog.requestId, 'partida:2');
        assert.equal(app.dialog.readOnly, true);
        app.handleDialogComplete({requestId: 'partida:1'});
        assert.equal(app.dialog.requestId, 'partida:2');
        assert.equal(app.waitingDialogRequestId, 'partida:2');
        app.handleDialogComplete({requestId: 'partida:2'});
        assert.equal(app.dialog, null);
    });

    test('places the highlighted match state between the match actions and account menu', () => {
        const app = createStatusApp();
        app.match.creatorUserId = app.user.id;
        const toolbar = templateText(app.renderAccountBar());
        const exitMatchIndex = toolbar.indexOf('Salir de la partida');
        const resetMatchIndex = toolbar.indexOf('Reiniciar partida');

        assert.ok(exitMatchIndex >= 0);
        assert.ok(resetMatchIndex > exitMatchIndex);
        assert.ok(toolbar.indexOf('match-actions') <
            toolbar.indexOf('class="match-status-group"'));
        assert.ok(toolbar.indexOf('class="match-status-group"') <
            toolbar.indexOf('class="account-menu"'));
        assert.ok(toolbar.indexOf('class="match-status"') < toolbar.indexOf('class="account-menu"'));
        assert.match(toolbar, /role="status" aria-live="polite" aria-atomic="true"/u);
        assert.match(toolbar, /Tu turno/u);
        app.route = 'matches';
        assert.doesNotMatch(templateText(app.renderAccountBar()), /class="match-status"/u);
        const styles = McApp.styles.map(style => style.cssText).join('');
        assert.match(styles, /\.match-account-bar\s*\{[^}]*display:\s*grid;[^}]*max-width:\s*none/su);
        assert.match(styles, /\.match-account-bar\s*\{[^}]*grid-template-columns:\s*max-content minmax\(0, 1fr\) max-content/su);
        assert.match(styles, /\.match-status-group\s*\{[^}]*display:\s*flex;[^}]*justify-content:\s*center;[^}]*gap:\s*8px/su);
        assert.match(styles, /\.match-status\s*\{[^}]*flex:\s*1 1 auto;[^}]*font-weight:\s*700/su);
        assert.match(styles, /@media \(max-width: 1000px\)[\s\S]*grid-column:\s*1 \/ -1;[\s\S]*grid-row:\s*2/u);
    });

    test('updates the central state across turns, the villain phase and end-of-round work', () => {
        const app = createStatusApp();
        assert.equal(app.matchStatusText, 'Tu turno');
        app.handleSocketMatch({...app.match, currentTurnPlayer: 'guest'});
        assert.equal(app.matchStatusText, 'Turno de Capitana Marvel');
        app.player = 'guest';
        assert.equal(app.matchStatusText, 'Tu turno');
        app.handleSocketMatch({...app.match, phase: 'villain'});
        assert.equal(app.matchStatusText, 'Fase del villano');
        app.handleSocketMatch({...app.match, phase: 'players', currentTurnPlayer: null});
        assert.equal(app.matchStatusText, 'Finalizando la fase de jugadores...');
        app.handleSocketMatch({...app.match, phase: 'round-complete'});
        assert.equal(app.matchStatusText, 'Preparando la siguiente ronda...');
    });

    test('reflects private decision waits until their matching completion event', () => {
        const app = createStatusApp();
        app.openDialog({
            targetPlayer: 'guest',
            targetPlayerName: 'Capitana Marvel',
            requestId: 'decision',
        });
        assert.equal(app.matchStatusText, 'Esperando la respuesta de Capitana Marvel...');
        app.handleDialogComplete({requestId: 'other-decision'});
        assert.match(app.matchStatusText, /Esperando/u);
        app.handleDialogComplete({requestId: 'decision'});
        assert.equal(app.matchStatusText, 'Tu turno');
        app.openDialog({targetPlayer: 'local'});
        assert.equal(app.matchStatusText, 'Esperando tu respuesta...');
        app.dialog = null;
        assert.equal(app.matchStatusText, 'Tu turno');
    });

    test('shows mulligan selection and waiting without retaining them when initialization completes', () => {
        const app = createStatusApp({dialog: {isMulligan: true}});
        assert.equal(app.matchStatusText, 'Elige tu mulligan');
        app.dialog = null;
        app.mulliganWaiting = true;
        assert.equal(app.matchStatusText, 'Mulligan completado. Esperando a los demás jugadores...');
        app.handleSocketMatch({...app.match, initialized: true});
        assert.equal(app.matchStatusText, 'Tu turno');
    });

    test('distinguishes requested actions from the actual player turn for both clients', () => {
        const app = createStatusApp();
        app.match = {...app.match, actionRequest: {
            requesterId: 'local', requester: 'Jugador',
            targetId: 'guest', target: 'Jugador', status: 'pending',
        }};
        assert.equal(app.matchStatusText,
            'Esperando la respuesta de Capitana Marvel a la petición de acción...');
        app.player = 'guest';
        assert.equal(app.matchStatusText, 'Capitán América te ha pedido una acción');
        app.match = {...app.match, actionRequest: {...app.match.actionRequest, status: 'accepted'}};
        assert.equal(app.matchStatusText, 'Estás realizando acciones para Capitán América');
        app.player = 'local';
        assert.equal(app.matchStatusText, 'Esperando a que Capitana Marvel termine sus acciones...');
        app.match = {...app.match, actionRequest: null};
        assert.equal(app.matchStatusText, 'Tu turno');
    });

    test('surfaces reconnecting and syncing instead of showing a stale turn', () => {
        const app = createStatusApp();
        app.connectionState = 'disconnected';
        assert.equal(app.matchStatusText, 'Conexión perdida. Intentando reconectar...');
        app.connectionState = 'syncing';
        assert.equal(app.matchStatusText, 'Conexión restablecida. Sincronizando la partida...');
        app.connectionState = 'sync-error';
        assert.equal(app.matchStatusText, 'No se pudo sincronizar la partida con el servidor.');
        app.connectionState = 'connected';
        assert.equal(app.matchStatusText, 'Tu turno');
    });

    test('shows setup, elimination, reset and the final result instead of a previous turn or wait', () => {
        const app = createStatusApp();
        app.match = {...app.match, initialized: false};
        assert.equal(app.matchStatusText, 'Preparando la partida...');
        app.match = {...app.match, initialized: true, players: [
            {...app.match.players[0], defeated: true}, app.match.players[1],
        ]};
        assert.equal(app.matchStatusText, 'Has sido eliminado. La partida continúa');
        app.resettingMatch = true;
        assert.equal(app.matchStatusText, 'Reiniciando la partida...');
        app.resettingMatch = false;
        app.waitingForResponse = 'Una espera anterior';
        app.match = {...app.match, gameOverReason: 'villain-defeated'};
        assert.equal(app.matchStatusText, '¡Victoria! Partida finalizada');
        app.match = {...app.match, gameOverReason: 'main-scheme-completed'};
        assert.equal(app.matchStatusText, 'Derrota. Partida finalizada');
    });

    test('only the creator can reset from the match toolbar', async () => {
        const alerts = [];
        const app = createApp({
            user: {id: 'guest'},
            match: {id: 'match-id', creatorUserId: 'creator'},
            showAlert: message => alerts.push(message),
            api: {resetMatch: () => assert.fail('No guest reset allowed')},
        });
        assert.equal(app.canResetMatch, false);
        await app.handleResetMatch();
        assert.deepEqual(alerts, ['Solo el creador puede reiniciar esta partida.']);
        app.user = {id: 'creator'};
        assert.equal(app.canResetMatch, true);
        app.match = {id: 'legacy-match'};
        assert.equal(app.canResetMatch, false);
    });

    test('the creator still confirms and completes a reset from the toolbar', async () => {
        const confirm = window.confirm;
        const calls = [];
        const resetMatch = {id: 'match-id', creatorUserId: 'creator', initialized: true};
        const app = createApp({
            user: {id: 'creator'},
            match: {id: 'match-id', name: 'partida', creatorUserId: 'creator'},
            api: {resetMatch: async id => {
                calls.push(id);
                return resetMatch;
            }},
            showAlert: () => assert.fail('No reset error expected'),
        });
        window.confirm = () => true;
        try {
            await app.handleResetMatch();
            assert.deepEqual(calls, ['match-id']);
            assert.strictEqual(app.match, resetMatch);
            assert.equal(app.resettingMatch, false);
        } finally {
            window.confirm = confirm;
        }
    });

    test('closes waiting when completion arrives before the first match snapshot', () => {
        const app = createApp();
        app.handleMulliganComplete({match: 'partida'});
        assert.equal(app.mulliganWaiting, false);
        assert.equal(app.waitingForResponse, '');
        assert.equal(app.waitingDialogRequestId, '');
    });

    test('ignores completion from another match, including a stale previous snapshot', () => {
        const app = createApp({match: {name: 'anterior'}});
        app.handleMulliganComplete({match: 'anterior'});
        assert.equal(app.mulliganWaiting, true);
        app.handleMulliganComplete();
        assert.equal(app.mulliganWaiting, true);
        app.handleMulliganComplete({match: 'partida'});
        assert.equal(app.mulliganWaiting, false);
    });

    test('uses pending match identity when the socket API has not been assigned', () => {
        const app = createApp({api: null});
        app.handleMulliganComplete({match: 'partida'});
        assert.equal(app.mulliganWaiting, false);
    });

    test('an initialized snapshot clears waiting if the completion event was missed', () => {
        const app = createApp({
            pendingResumeMatch: '',
            showAlert: () => assert.fail('No alert expected'),
        });
        app.handleSocketMatch({name: 'partida', initialized: true});
        assert.equal(app.mulliganWaiting, false);
        assert.equal(app.waitingForResponse, '');
    });

    test('an unfinished snapshot preserves the wait, and ordinary decision waits remain untouched', () => {
        const app = createApp({pendingResumeMatch: ''});
        app.handleSocketMatch({name: 'partida', initialized: false});
        assert.equal(app.mulliganWaiting, true);
        app.mulliganWaiting = false;
        app.waitingForResponse = 'Esperando la respuesta de otro jugador...';
        app.handleSocketMatch({name: 'partida', initialized: true});
        assert.equal(app.waitingForResponse, 'Esperando la respuesta de otro jugador...');
    });

    test('completion during the dialog response acknowledgement cannot reopen the wait', async () => {
        const app = createApp({
            mulliganWaiting: false,
            dialog: {
                isMulligan: true,
                closeOnResponse: true,
                callback: async () => {
                    app.handleMulliganComplete({match: 'partida'});
                },
            },
        });
        await app.handleDialogOk({detail: {selected: []}});
        assert.equal(app.mulliganWaiting, false);
        assert.equal(app.dialog, null);
    });

    test('binds the real dialog open property and never offers completion buttons', () => {
        const app = createApp();
        const template = app.renderMulliganWaitingDialog();
        const openIndex = template.strings.findIndex(part => part.includes('.open="'));
        assert.notEqual(openIndex, -1);
        assert.equal(template.values[openIndex], true);
        app.handleMulliganComplete({match: 'partida'});
        assert.equal(app.renderMulliganWaitingDialog().values[openIndex], false);
        assert.doesNotMatch(template.strings.join(''), /<md-.*button/u);
    });
});
