import {html, unsafeStatic} from 'lit/static-html.js';
import {keyed} from 'lit/directives/keyed.js';
import {css, LitElement} from 'lit-element';
import { router, navigator, outlet } from 'lit-element-router';

import '../../../utils/material-elements.js';
import '../mc-primary-navigation/mc-primary-navigation.js';
import '../mc-main/mc-main.js';
import '../../../pages/mc-create-match-page/mc-create-match-page.js';
import '../../../pages/mc-match-lobby-page/mc-match-lobby-page.js';
import '../../common/mc-alert/mc-alert.js';
import {Api} from '../../api/api.js';
import {Player} from '../../api/player.js';
import {Dialog} from '../../api/dialog.js';
import stylesDialog from '../../dialog/mc-dialog/mc-dialog.css.js';
import {EVENTS} from 'mc-endpoints';
import {
    getStaticAssetUrl,
    loadRemote,
    loadRuntimeConfig,
} from '../../../utils/remotes.js';
import {
    ADMIN_REQUIRED_ROUTE_NAMES,
    APP_ROUTES,
    AUTH_REQUIRED_ROUTE_NAMES,
    DECK_ROUTE_NAMES,
    getMatchPath,
    getGuestLandingRoute,
    getNavigationPath,
    USER_ROUTE_NAMES,
} from '../../../utils/app-routes.js';
import {UserSessionApi} from '../../../utils/user-session-api.js';
import {
    DIALOG_REVEAL_CARDS,
    MATCH_END_REASON_ALL_HEROES_DEFEATED,
    MATCH_END_REASON_MAIN_SCHEME_COMPLETED,
    MATCH_END_REASON_VILLAIN_DEFEATED,
    PLACE_DISCARD_PILE,
    PLACE_TUCKED,
} from 'mc-shared';

class McApp extends router(navigator(outlet(LitElement))) {
    static get styles() {
        return [
            stylesDialog,
            css`
              :host {
                display: block;
                width: 100%;
              }

              .match-shell {
                box-sizing: border-box;
                display: flex;
                flex-direction: column;
                position: fixed;
                inset: 0;
                overflow: hidden;
              }

              .match-shell .match-account-bar {
                flex: 0 0 auto;
              }

              .match-shell mc-main.match-main {
                box-sizing: border-box;
                display: flex;
                flex: 1 1 auto;
                flex-direction: column;
                min-height: 0;
                min-width: 0;
                overflow: hidden;
              }

              .match-actions {
                box-sizing: border-box;
                display: flex;
                align-items: center;
                gap: 4px;
              }

              .account-bar {
                box-sizing: border-box;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 8px;
                width: 100%;
                max-width: 1248px;
                min-height: 44px;
                margin: 0 auto;
                padding: 0 24px;
              }

              .account-menu {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-left: auto;
              }

              .account-bar md-text-button {
                --md-text-button-label-text-color:
                  var(--mc-color-primary, #6750a4);
              }

              .account-name {
                margin-right: 8px;
                font-weight: 600;
              }

              .match-account-bar {
                display: grid;
                grid-template-columns: max-content minmax(0, 1fr) max-content;
                column-gap: 24px;
                max-width: none;
                min-height: 60px;
                padding: 4px 8px;
              }

              .match-account-bar .match-actions {
                grid-column: 1;
                grid-row: 1;
                flex-wrap: wrap;
              }

              .match-account-bar .account-menu {
                grid-column: 3;
                grid-row: 1;
                flex-wrap: wrap;
                justify-content: flex-end;
                min-width: 0;
              }

              .match-account-bar .account-name {
                overflow-wrap: anywhere;
              }

              .match-status-group {
                grid-column: 2;
                grid-row: 1;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                min-width: 0;
              }

              .match-status {
                flex: 1 1 auto;
                min-width: 0;
                margin: 0;
                padding: 10px 16px;
                border-radius: 16px;
                background: #ede7f6;
                color: var(--mc-color-primary, #6750a4);
                font-size: 1.05rem;
                font-weight: 700;
                text-align: center;
                overflow-wrap: anywhere;
              }

              .return-dialog {
                flex: 0 0 auto;
                --md-filled-button-container-shape: 100px;
                --md-filled-button-container-color: var(--mc-color-primary, #6750a4);
                --md-filled-button-label-text-color: #ffffff;
                --md-filled-button-label-text-weight: 700;
                --md-filled-button-label-text-size: 1rem;
              }

              @media (max-width: 1000px) {
                .match-account-bar {
                  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
                  padding: 8px;
                }

                .match-account-bar .account-menu {
                  grid-column: 2;
                }

                .match-status-group {
                  grid-column: 1 / -1;
                  grid-row: 2;
                  flex-wrap: wrap;
                }
              }

              @media (max-width: 700px) {
                .account-bar {
                  flex-wrap: wrap;
                  gap: 8px 14px;
                  padding: 0 12px;
                }

                .account-menu {
                  flex-wrap: wrap;
                  justify-content: flex-end;
                }
              }

              .mulligan-wait-content {
                box-sizing: border-box;
                min-width: min(420px, calc(100vw - 48px));
                padding: 24px;
                text-align: center;
              }

              .mulligan-wait-content h2 {
                margin-top: 0;
              }
            `,
        ];
    }
    static get properties() {
        return {
            route: { type: String },
            params: { type: Object },
            query: { type: Object },
            api: {type: Api},
            runtimeConfig: {attribute: false},
            match: {type: Object},
            player: {type: String, attribute: 'player'},
            dialog: {type: Object},
            dialogQueue: {attribute: false},
            tableConsultationMode: {type: Boolean},
            tableViewDialog: {attribute: false},
            alert: {type: Object},
            connectionState: {type: String},
            loadedRemotes: {type: Object},
            loadingRemotes: {type: Object},
            remoteErrors: {type: Object},
            appReady: {type: Boolean},
            configurationError: {type: String},
            resettingMatch: {type: Boolean},
            savingMatch: {type: Boolean},
            leavingMatch: {type: Boolean},
            user: {type: Object},
            sessionLoaded: {type: Boolean},
            logoutPending: {type: Boolean},
            waitingForResponse: {type: String},
            waitingDialogRequestId: {type: String},
            mulliganWaiting: {type: Boolean},
            firstPlayerTokenUrl: {type: String},
        };
    }
    static get routes() {
        return APP_ROUTES;
    }

    constructor() {
        super();

        this.route = '';
        this.params = {};
        this.query = {};

        this.dialog = null;
        this.dialogQueue = [];
        this.tableConsultationMode = false;
        this.tableViewDialog = null;
        this.completedDialogRequestIds = new Set();
        this.respondingDialogRequestIds = new Set();
        this.alert = null;
        this.connectionState = 'connecting';
        this.loadedRemotes = {};
        this.loadingRemotes = {};
        this.remoteErrors = {};
        this.remoteLoadPromises = new Map();
        this.appReady = false;
        this.configurationError = '';
        this.user = null;
        this.sessionLoaded = false;
        this.logoutPending = false;
        this.waitingForResponse = '';
        this.waitingDialogRequestId = '';
        this.mulliganWaiting = false;
        this.firstPlayerTokenUrl = '';

        this.api = null;
        this.userApi = null;
        this.runtimeConfig = null;
        this.match = null;
        this.player = '';
        this.pendingResumeMatch = '';

        this.apiDialog = null;
        this.gameOverNotice = '';
        this.resettingMatch = false;
        this.savingMatch = false;
        this.leavingMatch = false;
        this.removeConnectionStateListener = null;
        this.removeCommunicationErrorListener = null;
        this.addEventListener(EVENTS.MATCH.CREATED, this.handleMatchCreated.bind(this));
    }
    connectedCallback() {
        super.connectedCallback();

        this.initialize();
    }
    async initialize() {
        try {
            const config = await loadRuntimeConfig();
            if (!this.isConnected) {
                return;
            }
            this.runtimeConfig = config;

            const staticRemote = await loadRemote('mcStatic');
            if (typeof staticRemote.getAssetUrl !== 'function') {
                throw new Error('El remoto mc-static no expone getAssetUrl().');
            }
            window.mcStaticRemote = staticRemote;
            this.firstPlayerTokenUrl = getStaticAssetUrl('images/first-player-token.svg');
            this.addStaticIcon('favicon.ico', 'image/x-icon');
            this.addStaticIcon('favicon.svg', 'image/svg+xml');
            await Promise.all([
                this.loadStaticStylesheet('styles/main.css'),
                this.loadStaticStylesheet('font/championsicons-webfont.css'),
            ]);
            if (!this.isConnected) {
                return;
            }

            this.api = new Api(config.services);
            this.userApi = new UserSessionApi(config.services.users);
            this.user = await this.userApi.getCurrentUser();
            if (!this.isConnected) {
                return;
            }
            this.sessionLoaded = true;
            this.connectionState = this.user ? 'connecting' : '';
            if (this.user) {
                this.initializeAuthenticatedApi();
            }
            this.appReady = true;
            if (this.route) {
                this.router(this.route, this.params, this.query);
            }
        } catch (error) {
            this.configurationError = error.message;
        }
    }
    initializeAuthenticatedApi() {
        if (!this.api || !this.user || this.api.socket) {
            return;
        }

        this.removeConnectionStateListener = this.api.onConnectionState(state => {
            this.connectionState = state;
        });
        this.removeCommunicationErrorListener = this.api.onCommunicationError(error => {
            this.showAlert(error.message);
        });
        this.api.init();
        this.api.listenMatch(this.handleSocketMatch.bind(this));
        this.api.listen({
            event: EVENTS.MATCH.EXIT,
            callback: this.handleMatchExit.bind(this),
        });
        this.api.listen({
            event: EVENTS.MATCH.MULLIGAN_COMPLETE,
            callback: this.handleMulliganComplete.bind(this),
        });

        this.apiDialog = new Dialog(this.api);
        this.apiDialog.listenDialog(this.openDialog.bind(this));
        this.apiDialog.listenDialogComplete(
            this.handleDialogComplete.bind(this),
        );
    }
    addStaticIcon(path, type) {
        const existingIcon = Array.from(document.head.querySelectorAll('link[rel="icon"]'))
            .find(link => link.dataset.mcStaticPath === path);
        if (existingIcon) {
            return;
        }

        const link = document.createElement('link');
        link.rel = 'icon';
        link.type = type;
        link.href = getStaticAssetUrl(path);
        link.dataset.mcStaticPath = path;
        document.head.append(link);
    }
    loadStaticStylesheet(path) {
        const existingLink = Array.from(document.head.querySelectorAll('link[rel="stylesheet"]'))
            .find(link => link.dataset.mcStaticPath === path);
        if (existingLink) {
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = getStaticAssetUrl(path);
            link.dataset.mcStaticPath = path;
            link.addEventListener('load', resolve, {once: true});
            link.addEventListener('error', () => {
                link.remove();
                reject(new Error(`No se pudo cargar el recurso ${path} desde mc-static.`));
            }, {once: true});
            document.head.append(link);
        });
    }
    disconnectedCallback() {
        this.removeConnectionStateListener?.();
        this.removeCommunicationErrorListener?.();

        super.disconnectedCallback();
    }
    router(route, params, query, data) {
        const {match} = this;
        const requiresAuthentication = AUTH_REQUIRED_ROUTE_NAMES.has(route);
        const requiresAdministrator = ADMIN_REQUIRED_ROUTE_NAMES.has(route);

        this.route = route;
        this.params = params;
        this.query = query;
        if (route !== 'match') {
            this.dialog = null;
            this.dialogQueue = [];
            this.tableConsultationMode = false;
            this.tableViewDialog = null;
            this.completedDialogRequestIds?.clear();
            this.respondingDialogRequestIds?.clear();
            this.waitingForResponse = '';
            this.waitingDialogRequestId = '';
            this.mulliganWaiting = false;
        }
        console.log(route, params, query, data);
        if (!this.sessionLoaded &&
            (requiresAuthentication || route === 'matches')) {
            return;
        }
        if (requiresAuthentication && !this.user) {
            this.navigate('/login');
            return;
        }
        if (requiresAdministrator && this.user?.isAdmin !== true) {
            this.navigate('/');
            return;
        }
        if (route === 'matches' && !this.user) {
            this.navigate(getNavigationPath(getGuestLandingRoute(route)));
            return;
        }
        if (route === 'create-match') {
            this.navigate('/');
        } else if (route === 'match-legacy') {
            this.navigate(match?.id ? getMatchPath(match.id) : '/');
        } else if (route === 'match') {
            if (!params?.id) {
                this.navigate(match?.id ? getMatchPath(match.id) : '/');
            } else if (!this.api) {
                return;
            } else if (!match || match.id !== params.id ||
                this.api?.match !== match.name) {
                this.loadMatchById(params.id).catch(error =>
                    this.handleCommunicationError({detail: {message: error.message}})
                );
            } else {
                this.ensureRemote('mcMatch');
            }
        } else if (USER_ROUTE_NAMES.has(route)) {
            this.ensureRemote('mcUsers');
        } else if (DECK_ROUTE_NAMES.has(route)) {
            this.ensureRemote('mcDeck');
        }
    }
    async loadMatchById(id) {
        await this.ensureRemote('mcMatch');

        const matches = await this.api.getMatchesList();
        const selectedMatch = matches.find(match => match.id === id);

        if (!selectedMatch) {
            this.navigate('/');
            return;
        }
        if (this.route !== 'match' || this.params?.id !== id) {
            return;
        }

        const ownedPlayers = selectedMatch.players.filter(({userId}) =>
            userId === this.user?.id);
        const player = ownedPlayers.find(({id}) => id === this.player) || ownedPlayers[0];
        if (!player) {
            this.showAlert('No estás inscrito en esta partida.');
            this.navigate('/');
            return;
        }
        this.player = player.id || player.userId || player.name;
        this.api.beginMatch(selectedMatch.name);
        this.api.markMatchReady();
        await this.api.joinMatch(true);
    }
    async ensureRemote(remoteName) {
        if (this.loadedRemotes[remoteName]) {
            return;
        }
        const pendingLoad = this.remoteLoadPromises.get(remoteName);
        if (pendingLoad) {
            return pendingLoad;
        }

        this.loadingRemotes = {
            ...this.loadingRemotes,
            [remoteName]: true,
        };
        this.remoteErrors = {
            ...this.remoteErrors,
            [remoteName]: '',
        };
        const loadPromise = loadRemote(remoteName)
            .then(() => {
                this.loadedRemotes = {
                    ...this.loadedRemotes,
                    [remoteName]: true,
                };
            })
            .catch(error => {
                this.remoteErrors = {
                    ...this.remoteErrors,
                    [remoteName]: error.message,
                };
            })
            .finally(() => {
                this.loadingRemotes = {
                    ...this.loadingRemotes,
                    [remoteName]: false,
                };
                this.remoteLoadPromises.delete(remoteName);
            });
        this.remoteLoadPromises.set(remoteName, loadPromise);

        return loadPromise;
    }
    async prepareMatch() {
        await this.ensureRemote('mcMatch');
        if (!this.loadedRemotes.mcMatch) {
            throw new Error(
                this.remoteErrors.mcMatch || 'No se pudo cargar el remoto mc-match.',
            );
        }
    }
    openDialog({
       dialogType,
       data,
       showCancel,
       hideOk,
       hideViewTable = false,
       hideResponsiblePlayer = false,
       title,
       subtitle,
       closeOnResponse,
       targetPlayer,
       targetUserId,
       targetPlayerName,
       targetHeroName,
       showToAll = false,
       requestId,
       isMulligan,
       callback,
       tableInspection = false,
   }) {
        if (requestId && (this.completedDialogRequestIds?.has(requestId) ||
            this.respondingDialogRequestIds?.has(requestId) ||
            this.dialog?.requestId === requestId ||
            this.dialogQueue?.some(dialog => dialog.requestId === requestId))) {
            return;
        }
        const responsiblePlayer = this.getMatchPlayer(targetPlayer || this.player);
        targetPlayerName = responsiblePlayer?.superhero?.name ||
            targetHeroName || targetPlayerName || responsiblePlayer?.name || targetPlayer;
        const readOnly = Boolean(targetPlayer &&
            !this.ownsMatchPlayer(targetPlayer, targetUserId));
        if (readOnly && !showToAll) {
            if (this.hasPendingOwnMulligan) {
                return;
            }

            this.waitingForResponse = isMulligan ?
                `Esperando a que ${targetPlayerName || targetPlayer} termine su mulligan...` :
                `Esperando la respuesta de ${targetPlayerName || targetPlayer}...`;
            this.waitingDialogRequestId = requestId || '';
            return;
        }
        const dialog = {
            dialogType,
            title,
            subtitle,
            data,
            callback: readOnly ? undefined : callback,
            showCancel: readOnly ? false : showCancel,
            hideOk: readOnly || hideOk,
            hideViewTable,
            hideResponsiblePlayer,
            readOnly,
            targetPlayer,
            targetUserId,
            initiatingPlayer: targetPlayer || this.player,
            targetPlayerName,
            requestId,
            closeOnResponse: closeOnResponse ?? !requestId,
            isMulligan,
            viewOnly: tableInspection && this.tableConsultationMode,
        };
        if (dialog.viewOnly) {
            this.tableViewDialog = dialog;
            return;
        }
        this.dialogQueue ??= [];
        if (this.dialog) {
            this.dialogQueue = [...this.dialogQueue, dialog];
        } else {
            this.displayDialog(dialog);
        }
    }
    displayDialog(dialog) {
        this.dialog = dialog;
        if (!dialog && !this.tableViewDialog) {
            this.tableConsultationMode = false;
        }
        this.waitingForResponse = dialog?.readOnly ?
            `Esperando la respuesta de ${dialog.targetPlayerName}...` : '';
        this.waitingDialogRequestId = dialog?.readOnly ? dialog.requestId || '' : '';
    }
    finishDialog(dialog, completed = true) {
        if (completed && dialog?.requestId) {
            this.completedDialogRequestIds ??= new Set();
            this.completedDialogRequestIds.add(dialog.requestId);
        }
        if (this.dialog === dialog) {
            this.displayDialog(this.dialogQueue?.shift() || null);
        }
    }
    get hasPendingOwnMulligan() {
        return Boolean((this.dialog?.isMulligan && !this.dialog.readOnly) ||
            this.dialogQueue?.some(dialog => dialog.isMulligan && !dialog.readOnly));
    }
    handleDialogComplete({requestId} = {}) {
        if (!requestId) {
            return;
        }
        this.dialogQueue = (this.dialogQueue || [])
            .filter(dialog => dialog.requestId !== requestId);
        this.completedDialogRequestIds ??= new Set();
        this.completedDialogRequestIds.add(requestId);
        if (requestId && requestId === this.dialog?.requestId) {
            this.finishDialog(this.dialog);
        }
        if (requestId && requestId === this.waitingDialogRequestId) {
            this.waitingForResponse = '';
            this.waitingDialogRequestId = '';
        }
    }
    handleMulliganComplete({match} = {}) {
        const activeMatchName = this.api?.match ||
            this.pendingResumeMatch || this.match?.name;
        if (!match || match !== activeMatchName) {
            return;
        }

        this.waitingForResponse = '';
        this.waitingDialogRequestId = '';
        this.mulliganWaiting = false;
    }
    handleViewDiscard(e) {
        const {cards, title, isPlayerDeck} = e.detail;
        const player = this.player;
        const tableInspection = this.tableConsultationMode;
        const playFromPlace = !tableInspection && isPlayerDeck ?
            PLACE_DISCARD_PILE :
            null;

        this.openDialog({
            dialogType: DIALOG_REVEAL_CARDS,
            title,
            subtitle: tableInspection ?
                'Consulta las cartas del descarte.' :
                isPlayerDeck ?
                'Ordenadas desde la carta superior hacia abajo. Selecciona una carta que puedas jugar desde el descarte.' :
                'Ordenadas desde la carta superior hacia abajo.',
            data: {
                cards,
                rotatePlanCards: true,
                playFromPlace,
            },
            callback: tableInspection ? () => {} : async response => {
                if (response?.selected?.playFrom?.includes(playFromPlace)) {
                    await new Player(this.api).playCard(
                        player,
                        response.selected.id
                    );
                }
            },
            tableInspection,
        });
    }
    handleViewTuckedCards(e) {
        const {card, cards} = e.detail;
        const player = this.player;

        if (!cards?.length) {
            return;
        }

        const tableInspection = this.tableConsultationMode;
        this.openDialog({
            dialogType: DIALOG_REVEAL_CARDS,
            title: card?.name ?
                `Cartas metidas debajo de ${card.name}` :
                'Cartas metidas debajo',
            subtitle: tableInspection ?
                'Consulta las cartas metidas debajo de esta carta.' :
                'Selecciona una carta jugable para jugarla desde aquí.',
            data: {
                cards,
                playFromPlace: tableInspection ? null : PLACE_TUCKED,
            },
            callback: tableInspection ? () => {} : async response => {
                if (response?.selected?.playable === true) {
                    await new Player(this.api).playCard(
                        player,
                        response.selected.id
                    );
                }
            },
            tableInspection,
        });
    }
    handleViewKnownCards(e) {
        const {cards, title} = e.detail;
        if (!cards?.length) {
            return;
        }

        this.openDialog({
            dialogType: DIALOG_REVEAL_CARDS,
            title,
            subtitle: 'Estas son las cartas del mazo que has visto.',
            data: {cards},
            callback: () => {},
            tableInspection: this.tableConsultationMode,
        });
    }
    handleViewPlayerHand(e) {
        const playerId = e.detail?.playerId;
        const player = this.getMatchPlayer(playerId);
        if (!player || !this.ownsMatchPlayer(playerId)) {
            return;
        }

        const cards = Array.isArray(player.hand) ? player.hand : [];
        this.openDialog({
            dialogType: DIALOG_REVEAL_CARDS,
            title: `Mano de ${player.superhero?.name || player.name}`,
            subtitle: cards.length ?
                'Cartas en la mano de este superhéroe.' :
                'Este superhéroe no tiene cartas en la mano.',
            data: {cards},
            callback: () => {},
            tableInspection: this.tableConsultationMode,
        });
    }
    showAlert(msg) {
        this.alert = {
            msg,
            open: true
        };
    }
    handleAlertOk() {
        this.alert = null;
    }
    async handleCancelDialog() {
        const currentDialog = this.dialog;
        if (!currentDialog || currentDialog.readOnly) {
            return;
        }

        try {
            this.respondingDialogRequestIds ??= new Set();
            if (currentDialog.requestId) {
                this.respondingDialogRequestIds.add(currentDialog.requestId);
            }
            if (currentDialog.closeOnResponse) {
                this.finishDialog(currentDialog, false);
            }
            await currentDialog.callback();
        } catch (error) {
            this.finishDialog(currentDialog, false);
            this.showAlert(error.message);
            return;
        } finally {
            this.respondingDialogRequestIds?.delete(currentDialog.requestId);
        }

        this.finishDialog(currentDialog);
    }
    handleChangeMenu(e) {
        const {card, menuOptions, callback} = e.detail;

        this.openDialog({
            dialogType: 'list',
            showCancel: true,
            hideOk: true,
            hideViewTable: true,
            hideResponsiblePlayer: true,
            callback,
            data: {
                card,
                options: menuOptions,
            }
        });
    }
    handleTurnEndConfirmation(e) {
        const {callback, reasons} = e.detail;

        this.openDialog({
            dialogType: 'confirm',
            title: 'Finalizar turno',
            subtitle: '¿Seguro que quieres finalizar el turno?',
            data: {reasons},
            callback,
        });
    }
    handleBasicActivationConfirmation(e) {
        const {basicActivation, callback} = e.detail;

        this.openDialog({
            dialogType: 'confirm',
            showCancel: true,
            data: {
                basicActivation,
                cancelText: 'Cancelar',
            },
            callback,
        });
    }
    handleViewTable() {
        if (this.tableViewDialog) {
            this.handleTableViewDialogClose();
            return;
        }
        if (!this.dialog) {
            return;
        }

        if (this.dialogBoardPlayerId) {
            this.player = this.dialogBoardPlayerId;
        }
        this.tableConsultationMode = true;
    }
    handleReturnToDialog() {
        this.tableViewDialog = null;
        this.tableConsultationMode = false;
    }
    handleTableViewDialogClose() {
        this.tableViewDialog = null;
        if (!this.dialog) {
            this.tableConsultationMode = false;
        }
    }
    handleTableViewDialogClosed() {
        this.handleTableViewDialogClose();
    }
    handleCloseDialog() {
        if (this.dialog && !this.tableConsultationMode) {
            this.shadowRoot.getElementById('dialog')?.show();
        }
    }
    handleCloseMulliganWaitDialog() {
        if (this.mulliganWaiting && !this.hasPendingOwnMulligan) {
            this.shadowRoot.getElementById('mulligan-wait-dialog')?.show();
        }
    }
    async handleDialogOk(e) {
        const {detail} = e;
        const currentDialog = this.dialog;
        if (!currentDialog || currentDialog.readOnly) {
            return;
        }

        try {
            this.respondingDialogRequestIds ??= new Set();
            if (currentDialog.requestId) {
                this.respondingDialogRequestIds.add(currentDialog.requestId);
            }
            if (currentDialog.isMulligan) {
                this.mulliganWaiting = true;
                this.waitingForResponse = '';
                this.waitingDialogRequestId = '';
            }

            if (currentDialog.closeOnResponse && this.dialog === currentDialog) {
                this.finishDialog(currentDialog, false);
            }
            await currentDialog.callback(detail);
        } catch (error) {
            this.finishDialog(currentDialog, false);
            if (currentDialog.isMulligan) {
                this.mulliganWaiting = false;
            }
            this.showAlert(error.message);
            return;
        } finally {
            this.respondingDialogRequestIds?.delete(currentDialog.requestId);
        }

        this.finishDialog(currentDialog);
    }
    handleCommunicationError(e) {
        this.showAlert(e.detail.message);
    }
    handleUserAuthenticated(e) {
        this.user = e.detail.user;
        this.sessionLoaded = true;
        this.waitingForResponse = '';
        this.waitingDialogRequestId = '';
        this.initializeAuthenticatedApi();
        this.navigate('/');
    }
    handleUserUpdated(e) {
        this.user = e.detail.user;
        if (this.user?.isAdmin !== true &&
            ADMIN_REQUIRED_ROUTE_NAMES.has(this.route)) {
            this.navigate('/');
        }
    }
    handleUserSessionInvalidated() {
        return this.handleUserLogout();
    }
    async handleUserLogout() {
        if (this.logoutPending || !this.userApi) {
            return;
        }

        this.logoutPending = true;
        try {
            await this.userApi.logout();
            this.api?.disconnect();
            this.removeConnectionStateListener?.();
            this.removeCommunicationErrorListener?.();
            this.removeConnectionStateListener = null;
            this.removeCommunicationErrorListener = null;
            this.user = null;
            this.player = '';
            this.match = null;
            this.dialog = null;
            this.dialogQueue = [];
            this.tableConsultationMode = false;
            this.tableViewDialog = null;
            this.completedDialogRequestIds?.clear();
            this.respondingDialogRequestIds?.clear();
            this.waitingForResponse = '';
            this.waitingDialogRequestId = '';
            this.connectionState = '';
            this.navigate('/login');
        } catch (error) {
            this.showAlert(error.message);
        } finally {
            this.logoutPending = false;
        }
    }
    handleAccountLink(event, path) {
        event.preventDefault();
        this.navigate(path);
    }
    get connectionStatusMessage() {
        const messages = {
            connecting: 'Conectando con el servidor...',
            disconnected: 'Conexión perdida. Intentando reconectar...',
            syncing: 'Conexión restablecida. Sincronizando la partida...',
            'sync-error': 'No se pudo sincronizar la partida con el servidor.',
        };
        return messages[this.connectionState] || '';
    }
    getMatchPlayer(identifier) {
        return this.match?.players?.find(player =>
            (player.id || player.userId || player.name) === identifier);
    }
    get dialogBoardPlayerId() {
        const identifier = this.dialog?.targetPlayer;
        const player = this.getMatchPlayer(identifier);

        return player && this.ownsMatchPlayer(identifier, this.dialog?.targetUserId) ?
            player.id || player.userId || player.name || '' :
            '';
    }
    ownsMatchPlayer(identifier, targetUserId) {
        if (!this.user?.id) {
            return false;
        }
        const player = this.getMatchPlayer(identifier);
        const ownerId = player ? player.userId || player.id : targetUserId;
        return ownerId === this.user.id;
    }
    static getOrderedMatchPlayers(match) {
        const players = match?.players || [];
        const initialIndex = Math.max(0, players.findIndex(player => player.initial));

        return players.slice(initialIndex).concat(players.slice(0, initialIndex));
    }
    get hasRoomForSecondaryBoard() {
        return globalThis.window?.matchMedia ?
            globalThis.window.matchMedia('(min-width: 1501px)').matches :
            globalThis.window?.innerWidth > 1500;
    }
    normalizeSelectedPlayer(previousMatch) {
        const ownedPlayers = this.match?.players?.filter(player =>
            (player.userId || player.id) === this.user?.id) || [];
        if (!ownedPlayers.length) {
            return;
        }
        const hasRoomForSecondaryBoard = this.hasRoomForSecondaryBoard;
        const startingMatch = previousMatch?.name !== this.match.name ||
            (!previousMatch?.initialized && this.match.initialized);
        const startingPlayersPhase = ownedPlayers.length > 1 &&
            previousMatch?.phase !== 'players' &&
            this.match.phase === 'players' &&
            this.match.playing !== false &&
            !this.match.gameOverReason;
        const defaultPlayer = McApp.getOrderedMatchPlayers(this.match)
            .find(player => !player.defeated && this.ownsMatchPlayer(player.id)) ||
            ownedPlayers[0];
        if (startingMatch || (startingPlayersPhase && !hasRoomForSecondaryBoard)) {
            this.player = defaultPlayer.id;
            return;
        }
        if (!ownedPlayers.some(player => player.id === this.player)) {
            this.player = defaultPlayer.id;
            return;
        }
        if (!hasRoomForSecondaryBoard &&
            ownedPlayers.length > 1 &&
            previousMatch?.name === this.match.name &&
            previousMatch.phase === 'players' &&
            this.match.phase === 'players' &&
            this.match.playing !== false &&
            !this.match.gameOverReason &&
            previousMatch.currentTurnPlayer === this.player &&
            this.match.currentTurnPlayer !== previousMatch.currentTurnPlayer) {
            const players = McApp.getOrderedMatchPlayers(previousMatch);
            const finishedIndex = players.findIndex(player => player.id === this.player);
            const currentIndex = players.findIndex(player =>
                player.id === this.match.currentTurnPlayer);
            const nextPlayer = players.slice(Math.max(finishedIndex + 1, currentIndex))
                .find(player => {
                    const currentPlayer = this.getMatchPlayer(player.id);

                    return currentPlayer && !currentPlayer.defeated &&
                        this.ownsMatchPlayer(player.id);
                });
            if (finishedIndex >= 0 && nextPlayer) {
                this.player = nextPlayer.id;
            }
        }
    }
    handleSelectControlledPlayer({detail: {player}}) {
        if (this.ownsMatchPlayer(player)) {
            this.player = player;
        }
    }
    getMatchPlayerName(identifier, fallback = 'otro jugador') {
        const player = this.getMatchPlayer(identifier);
        return player?.superhero?.name || player?.name || fallback;
    }
    get matchStatusText() {
        const consultingTable = this.tableConsultationMode && this.dialog;

        if (this.resettingMatch) {
            return 'Reiniciando la partida...';
        }
        if (this.connectionStatusMessage) {
            return this.connectionStatusMessage;
        }
        const {match} = this;
        if (match?.gameOverReason) {
            return match.gameOverReason === MATCH_END_REASON_VILLAIN_DEFEATED ?
                '¡Victoria! Partida finalizada' :
                'Derrota. Partida finalizada';
        }
        if (this.dialog?.isMulligan && !consultingTable) {
            return 'Elige tu mulligan';
        }
        if (this.mulliganWaiting &&
            !this.hasPendingOwnMulligan &&
            !consultingTable) {
            return 'Mulligan completado. Esperando a los demás jugadores...';
        }
        if (this.waitingForResponse && !consultingTable) {
            return this.waitingForResponse;
        }
        if (this.dialog && !consultingTable) {
            return 'Esperando tu respuesta...';
        }
        if (!match) {
            return 'Cargando la partida...';
        }
        const localId = this.player || this.user?.id;
        if (this.getMatchPlayer(localId)?.defeated) {
            return 'Has sido eliminado. La partida continúa';
        }
        if (match.initialized === false || match.initializing) {
            return 'Preparando la partida...';
        }
        if (match.phase === 'villain') {
            return 'Fase del villano';
        }
        if (match.phase === 'round-complete') {
            return 'Preparando la siguiente ronda...';
        }
        if (match.phase === 'players' && match.playing) {
            const request = match.actionRequest;
            const targetId = request?.targetId || request?.target;
            const requesterId = request?.requesterId || request?.requester;
            const target = this.getMatchPlayerName(targetId, request?.target);
            const requester = this.getMatchPlayerName(requesterId, request?.requester);
            if (request?.status === 'pending') {
                return targetId === localId ?
                    `${requester} te ha pedido una acción` :
                    `Esperando la respuesta de ${target} a la petición de acción...`;
            }
            if (request?.status === 'accepted') {
                return targetId === localId ?
                    `Estás realizando acciones para ${requester}` :
                    `Esperando a que ${target} termine sus acciones...`;
            }
            if (match.currentTurnPlayer === localId) {
                return 'Tu turno';
            }
            return match.currentTurnPlayer ?
                `Turno de ${this.getMatchPlayerName(match.currentTurnPlayer)}` :
                'Finalizando la fase de jugadores...';
        }

        return match.playing ? 'Partida en curso' : 'Esperando el inicio de la partida...';
    }
    renderConnectionStatus() {
        const message = this.connectionStatusMessage;

        return message ? html`
            <div role="status" aria-live="polite">${message}</div>
        ` : '';
    }
    handleMatchChanged(e) {
        const {match} = e.detail;
        const previousMatch = this.match;

        this.match = match;
        this.normalizeSelectedPlayer(previousMatch);
    }
    handleSocketMatch(match) {
        const previousMatch = this.match;
        this.match = match;
        this.normalizeSelectedPlayer(previousMatch);
        if (match.initialized && this.mulliganWaiting) {
            this.handleMulliganComplete({match: match.name});
        }
        const gameOverNotice = `${match.name}:${match.gameOverReason}`;
        const gameOverMessages = {
            [MATCH_END_REASON_MAIN_SCHEME_COMPLETED]:
                'Has perdido la partida porque se ha completado el plan principal.',
            [MATCH_END_REASON_VILLAIN_DEFEATED]:
                '¡Has ganado la partida! Has derrotado al villano.',
            [MATCH_END_REASON_ALL_HEROES_DEFEATED]:
                'Has perdido la partida porque todos los superhéroes han sido derrotados.',
        };
        const gameOverMessage = gameOverMessages[match.gameOverReason];
        if (gameOverMessage && this.gameOverNotice !== gameOverNotice) {
            this.gameOverNotice = gameOverNotice;
            this.showAlert(gameOverMessage);
        }
        if (this.pendingResumeMatch === match.name && this.api.match === match.name) {
            this.pendingResumeMatch = '';
            this.navigate(getMatchPath(match.id));
        }
    }
    handleMatchCreated(e) {
        const {match, player} = e.detail;
        const previousMatch = this.match;

        this.pendingResumeMatch = '';
        this.gameOverNotice = '';
        this.mulliganWaiting = false;
        this.match = match;
        this.player = player.id || player.userId || player.name;
        this.normalizeSelectedPlayer(previousMatch);

        this.navigate(getMatchPath(match.id));
        this.api.joinMatch(true);
    }
    handleMatchResumeRequested(e) {
        const {matchName, player} = e.detail;

        this.player = player;
        this.pendingResumeMatch = matchName;
    }
    handleMatchResumed(e) {
        const {match: resumedMatch, matchName, player} = e.detail;

        if (this.match?.name !== matchName || !this.ownsMatchPlayer(this.player)) {
            this.player = player;
        }
        if (resumedMatch) {
            const previousMatch = this.match;
            this.match = resumedMatch;
            this.normalizeSelectedPlayer(previousMatch);
            this.pendingResumeMatch = '';
            this.gameOverNotice = '';
            this.mulliganWaiting = false;
            this.navigate(getMatchPath(resumedMatch.id));
            return;
        }
        if (this.match?.name === matchName && this.pendingResumeMatch === matchName) {
            this.pendingResumeMatch = '';
            this.navigate(getMatchPath(this.match.id));
        } else if (this.match?.name !== matchName) {
            this.pendingResumeMatch = matchName;
        }
    }
    handleNavigation(e) {
        const {route, replace = false} = e.detail;
        const path = getNavigationPath(route);
        if (replace) {
            window.history.replaceState({}, null, path);
            window.dispatchEvent(new CustomEvent('route'));
            return;
        }

        this.navigate(path);
    }
    get canResetMatch() {
        return Boolean(this.user?.id &&
            this.match?.creatorUserId === this.user.id);
    }
    get canSaveMatch() {
        return Boolean(this.match?.autoSave === false &&
            this.user?.id &&
            this.match.players?.some(player => player.userId === this.user.id));
    }
    async handleSaveMatch() {
        if (!this.canSaveMatch) {
            return;
        }
        if (this.savingMatch || this.resettingMatch || this.leavingMatch ||
            !this.match?.id) {
            return;
        }

        const match = this.match;
        this.savingMatch = true;
        try {
            await this.api.saveMatch();
            if (this.match === match) {
                this.showAlert('Partida guardada.');
            }
        } catch (error) {
            if (this.match === match) {
                this.showAlert(error.message);
            }
        } finally {
            this.savingMatch = false;
        }
    }
    async handleResetMatch() {
        if (!this.canResetMatch) {
            this.showAlert('Solo el creador puede reiniciar esta partida.');
            return;
        }
        const match = this.match;
        if (this.resettingMatch || this.savingMatch || this.leavingMatch ||
            !match?.id || !window.confirm(
            `¿Reiniciar la partida "${match.name}"? Se perderá el progreso actual.`
        )) {
            return;
        }

        this.resettingMatch = true;
        try {
            this.match = await this.api.resetMatch(match.id);
        } catch (error) {
            this.showAlert(error.message);
        } finally {
            this.resettingMatch = false;
        }
    }
    handleMatchExit({match: matchName}) {
        if (matchName && this.api?.match !== matchName) {
            return;
        }
        this.finishMatchExit(matchName);
    }
    finishMatchExit(matchName) {
        this.api?.endMatch?.(matchName);
        this.match = null;
        this.player = '';
        this.pendingResumeMatch = '';
        this.mulliganWaiting = false;
        this.waitingForResponse = '';
        this.waitingDialogRequestId = '';
        this.dialog = null;
        this.dialogQueue = [];
        this.tableViewDialog = null;
        this.tableConsultationMode = false;
        this.navigate(getNavigationPath('matches'));
    }
    async handleExitMatch() {
        const match = this.match;
        if (this.leavingMatch || this.resettingMatch || this.savingMatch || !match) {
            return;
        }

        this.leavingMatch = true;
        try {
            if (this.canResetMatch && match.autoSave === false) {
                await this.api.exitMatch();
            } else {
                await this.api.leaveMatch();
            }
            this.finishMatchExit(match.name);
        } catch (error) {
            if (this.match === match) {
                this.showAlert(error.message);
            }
        } finally {
            this.leavingMatch = false;
        }
    }
    renderDialogElement(dialog, id, open) {
        let dialogElement = html``;
        let dialogClass = '';

        if (dialog) {
            const {
                dialogType,
                data,
                showCancel,
                hideOk,
                hideViewTable,
                hideResponsiblePlayer,
                title,
                subtitle,
                readOnly,
                targetPlayerName,
                viewOnly,
            } = dialog;

            const tag = unsafeStatic(`mc-${dialogType}-dialog`);
            dialogClass = dialogType === 'pay-cost' ?
                'large pay-cost' :
                dialogType === 'defense' ? 'large' : '';
            dialogElement = keyed(dialog, html`<${tag}
                    slot="content"
                    title="${title}"
                    subtitle="${subtitle}"
                    .data="${data}"
                    .showCancel="${showCancel}"
                    .hideOk="${hideOk}"
                    .hideViewTable="${hideViewTable}"
                    .hideResponsiblePlayer="${hideResponsiblePlayer}"
                    .readOnly="${readOnly}"
                    .viewOnly="${viewOnly}"
                    .targetPlayerName="${targetPlayerName}"
                    @dialog-ok="${viewOnly ?
                        this.handleTableViewDialogClose.bind(this) :
                        this.handleDialogOk.bind(this)}"
                    @dialog-cancel="${viewOnly ?
                        this.handleTableViewDialogClose.bind(this) :
                        this.handleCancelDialog.bind(this)}"
                    @dialog-view-table="${this.handleViewTable.bind(this)}"
                    @dialog-viewer-close="${this.handleTableViewDialogClose.bind(this)}"
                ></${tag}>`);
        }

        return html`
            <md-dialog
                id="${id}"
                .quick="${true}"
                class="dialog ${dialogClass}"
                ?open="${Boolean(dialog && open)}"
                @cancel="${event => {
                    if (dialog?.readOnly && !dialog?.viewOnly) {
                        event.preventDefault();
                    }
                }}"
                @closed="${id === 'table-view-dialog' ?
                    this.handleTableViewDialogClosed.bind(this) :
                    this.handleCloseDialog.bind(this)}"
            >
                ${dialogElement}
            </md-dialog>
        `;
    }
    renderDialog() {
        return html`
            ${this.renderDialogElement(
                this.dialog,
                'dialog',
                !this.tableConsultationMode,
            )}
            ${this.tableViewDialog ? this.renderDialogElement(
                this.tableViewDialog,
                'table-view-dialog',
                true,
            ) : ''}
        `;
    }
    renderAlert() {
        const {alert} = this;

        return alert ? html`
            <mc-alert
                msg="${alert.msg}"
                .open="${alert.open}"
                @alert-ok="${this.handleAlertOk}"
            ></mc-alert>
        ` : html``;
    }
    renderMulliganWaitingDialog() {
        return html`
            <md-dialog
                id="mulligan-wait-dialog"
                .quick="${true}"
                class="dialog"
                .open="${this.mulliganWaiting && !this.hasPendingOwnMulligan}"
                @closed="${this.handleCloseMulliganWaitDialog.bind(this)}"
            >
                <div
                    slot="content"
                    class="mulligan-wait-content"
                    role="status"
                    aria-live="polite"
                >
                    <h2 class="title">Mulligan completado</h2>
                    <p>Has terminado tu mulligan. Esperando a que los demás jugadores terminen...</p>
                </div>
            </md-dialog>
        `;
    }
    renderAccountBar() {
        return html`
            <div class="account-bar ${this.route === 'match' ? 'match-account-bar' : ''}"
                aria-label="Cuenta de usuario">
                ${this.route === 'match' ? html`
                    <div class="match-actions" role="group" aria-label="Acciones de partida">
                        <md-text-button
                            .disabled="${this.leavingMatch || this.resettingMatch || this.savingMatch}"
                            @click="${this.handleExitMatch.bind(this)}"
                        >
                            ${this.leavingMatch ? 'Saliendo...' : 'Salir de la partida'}
                        </md-text-button>
                        ${this.canResetMatch ? html`
                        <md-text-button
                            .disabled="${this.resettingMatch || this.leavingMatch || this.savingMatch || !this.match?.id}"
                            @click="${this.handleResetMatch.bind(this)}"
                        >${this.resettingMatch ? 'Reiniciando...' : 'Reiniciar partida'}</md-text-button>
                        ` : ''}
                        ${this.canSaveMatch ? html`
                        <md-text-button
                            .disabled="${this.savingMatch || this.leavingMatch || this.resettingMatch || !this.match?.id}"
                            @click="${this.handleSaveMatch.bind(this)}"
                        >${this.savingMatch ? 'Guardando...' : 'Guardar partida'}</md-text-button>
                        ` : ''}
                    </div>
                    <div class="match-status-group">
                        ${this.dialog && this.tableConsultationMode ? html`
                        <md-filled-button
                            class="return-dialog"
                            type="button"
                            @click="${this.handleReturnToDialog.bind(this)}"
                        >Volver al diálogo</md-filled-button>
                        ` : ''}
                        <p class="match-status" role="status" aria-live="polite" aria-atomic="true">
                            ${this.matchStatusText}
                        </p>
                    </div>
                ` : ''}
                <div class="account-menu">
                    ${this.user ? html`
                        <span class="account-name">${this.user.name}</span>
                        <md-text-button
                            href="/profile"
                            @click="${event => this.handleAccountLink(event, '/profile')}"
                        >Mi usuario</md-text-button>
                        <md-text-button
                            type="button"
                            .disabled="${this.logoutPending}"
                            @click="${this.handleUserLogout.bind(this)}"
                        >${this.logoutPending ? 'Cerrando sesión...' : 'Cerrar sesión'}</md-text-button>
                    ` : html`
                        <md-text-button
                            href="/login"
                            @click="${event => this.handleAccountLink(event, '/login')}"
                        >Iniciar sesión</md-text-button>
                    `}
                </div>
            </div>
        `;
    }
    render() {
        const {api, match, player} = this;

        return html`
          <div class="${this.route === 'match' ? 'match-shell' : ''}">
              ${this.renderAccountBar()}
              ${this.route !== 'match' ? this.renderConnectionStatus() : ''}
              ${this.route !== 'match' ? html`
                  <mc-primary-navigation
                      .activeRoute="${this.route}"
                      .user="${this.user}"
                      @navigate-route="${this.handleNavigation.bind(this)}"
                  ></mc-primary-navigation>
              ` : ''}

              ${this.appReady ? html`
                  <mc-main
                      class="${this.route === 'match' ? 'match-main' : ''}"
                      .activeRoute="${this.route}"
                  >
                      <div route='matches'>
                          <mc-create-match-page
                              .api="${api}"
                              .user="${this.user}"
                              .active="${this.route === 'matches'}"
                              .prepareMatch="${this.prepareMatch.bind(this)}"
                              @match-resume-requested="${this.handleMatchResumeRequested.bind(this)}"
                              @match-resumed="${this.handleMatchResumed.bind(this)}"
                              @communication-error="${this.handleCommunicationError.bind(this)}"
                              @navigate-route="${this.handleNavigation.bind(this)}"
                          ></mc-create-match-page>
                      </div>
                      <div route='match-lobby'>
                          <mc-match-lobby-page
                              .api="${api}"
                              .user="${this.user}"
                              .id="${this.params?.id || ''}"
                              .routeQuery="${this.query}"
                              .active="${this.route === 'match-lobby'}"
                              .prepareMatch="${this.prepareMatch.bind(this)}"
                              @match-resumed="${this.handleMatchResumed.bind(this)}"
                              @navigate-route="${this.handleNavigation.bind(this)}"
                          ></mc-match-lobby-page>
                      </div>
                      <div route='match'>
                          ${this.renderRemote('mcMatch', html`
                              <mc-match-page
                                  .api="${api}"
                                  .match="${match}"
                                  .user="${this.user}"
                                  .dialogBoardPlayerId="${this.tableConsultationMode ?
                                      '' :
                                      this.dialogBoardPlayerId}"
                                  .tableConsultationMode="${this.tableConsultationMode}"
                                  player="${player}"
                                  @select-controlled-player="${this.handleSelectControlledPlayer.bind(this)}"
                                  .firstPlayerTokenUrl="${this.firstPlayerTokenUrl}"
                                  @change-menu="${this.handleChangeMenu.bind(this)}"
                                  @basic-activation-confirmation="${this.handleBasicActivationConfirmation.bind(this)}"
                                  @turn-end-confirmation="${this.handleTurnEndConfirmation.bind(this)}"
                                  @change-match="${this.handleMatchChanged.bind(this)}"
                                  @view-discard="${this.handleViewDiscard.bind(this)}"
                                  @view-known-cards="${this.handleViewKnownCards.bind(this)}"
                                  @view-tucked-cards="${this.handleViewTuckedCards.bind(this)}"
                                  @view-player-hand="${this.handleViewPlayerHand.bind(this)}"
                                  @communication-error="${this.handleCommunicationError.bind(this)}"
                              ></mc-match-page>
                          `)}
                      </div>
                      <div route='login register activate forgot-password reset-password profile change-password users user-detail'>
                          ${this.renderRemote('mcUsers', html`
                              <mc-users-app
                                  .serviceUrl="${this.runtimeConfig?.services?.users}"
                                  .pageRoute="${this.route}"
                                  .routeParams="${this.params}"
                                  .routeQuery="${this.query}"
                                  .user="${this.user}"
                                  @navigate-route="${this.handleNavigation.bind(this)}"
                                  @user-authenticated="${this.handleUserAuthenticated.bind(this)}"
                                  @user-updated="${this.handleUserUpdated.bind(this)}"
                                  @user-session-invalidated="${this.handleUserSessionInvalidated.bind(this)}"
                              ></mc-users-app>
                          `)}
                      </div>
                      <div route='decks decks-create decks-edit-new decks-edit'>
                          ${this.renderRemote('mcDeck', html`
                              <mc-deck-app
                                  .serviceUrl="${this.runtimeConfig?.services?.deck}"
                                  .pageRoute="${this.route}"
                                  .routeParams="${this.params}"
                                  .routeQuery="${this.query}"
                                  .user="${this.user}"
                                  @navigate-route="${this.handleNavigation.bind(this)}"
                              ></mc-deck-app>
                          `)}
                      </div>
                      <h1 route='not-found'>Not Found </h1>
                  </mc-main>
              ` : html`
                  <p role="${this.configurationError ? 'alert' : 'status'}">
                      ${this.configurationError ?
            `No se pudo cargar la configuración: ${this.configurationError}` :
            'Cargando la configuración de la aplicación...'}
                  </p>
              `}
          </div>
          ${this.renderDialog()}
          ${this.renderMulliganWaitingDialog()}
          ${this.renderAlert()}
        `;
    }
    renderRemote(remoteName, element) {
        if (this.loadedRemotes[remoteName]) {
            return element;
        }

        const error = this.remoteErrors[remoteName];
        if (error) {
            return html`<p role="alert">No se pudo cargar ${remoteName}: ${error}</p>`;
        }

        return html`<p role="status">Cargando ${remoteName}...</p>`;
    }
}

    customElements.define('mc-app', McApp);