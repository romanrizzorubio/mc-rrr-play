import {html, unsafeStatic} from 'lit/static-html.js';
import {keyed} from 'lit/directives/keyed.js';
import {css, LitElement} from 'lit-element';
import { router, navigator, outlet } from 'lit-element-router';

import '../../../utils/material-elements.js';
import '../mc-primary-navigation/mc-primary-navigation.js';
import '../mc-main/mc-main.js';
import '../../../pages/mc-create-match-page/mc-create-match-page.js';
import '../../common/mc-alert/mc-alert.js';
import {Api} from '../../api/api.js';
import {Dialog} from '../../api/dialog.js';
import stylesDialog from '../../dialog/mc-dialog/mc-dialog.css.js';
import {EVENTS} from 'mc-endpoints';
import {
    getStaticAssetUrl,
    loadRemote,
    loadRuntimeConfig,
} from '../../../utils/remotes.js';
import {
    APP_ROUTES,
    DECK_ROUTE_NAMES,
    getMatchPath,
    getNavigationPath,
} from '../../../utils/app-routes.js';
import {
    DIALOG_REVEAL_CARDS,
    MATCH_END_REASON_ALL_HEROES_DEFEATED,
    MATCH_END_REASON_MAIN_SCHEME_COMPLETED,
    MATCH_END_REASON_VILLAIN_DEFEATED,
} from 'mc-shared';

class McApp extends router(navigator(outlet(LitElement))) {
    static get styles() {
        return [
            stylesDialog,
            css`
              .match-actions {
                box-sizing: border-box;
                display: flex;
                justify-content: flex-end;
                max-width: 1200px;
                margin: 0 auto 24px;
                padding: 0 24px;
              }

              @media (max-width: 700px) {
                .match-actions {
                  padding: 0 12px;
                }
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
            alert: {type: Object},
            connectionState: {type: String},
            loadedRemotes: {type: Object},
            loadingRemotes: {type: Object},
            remoteErrors: {type: Object},
            appReady: {type: Boolean},
            configurationError: {type: String},
            resettingMatch: {type: Boolean},
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
        this.alert = null;
        this.connectionState = 'connecting';
        this.loadedRemotes = {};
        this.loadingRemotes = {};
        this.remoteErrors = {};
        this.remoteLoadPromises = new Map();
        this.appReady = false;
        this.configurationError = '';

        this.api = null;
        this.runtimeConfig = null;
        this.match = null;
        this.player = '';
        this.pendingResumeMatch = '';

        this.apiDialog = null;
        this.gameOverNotice = '';
        this.resettingMatch = false;
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
            this.removeConnectionStateListener = this.api.onConnectionState(state => {
                this.connectionState = state;
            });
            this.removeCommunicationErrorListener = this.api.onCommunicationError(error => {
                this.showAlert(error.message);
            });
            this.api.init();
            this.api.listenMatch(this.handleSocketMatch.bind(this));

            this.apiDialog = new Dialog(this.api);
            this.apiDialog.listenDialog(this.openDialog.bind(this));
            this.appReady = true;
            if (this.route === 'match' && this.params?.id &&
                (!this.match || this.match.id !== this.params.id)) {
                this.loadMatchById(this.params.id).catch(error =>
                    this.handleCommunicationError({detail: {message: error.message}})
                );
            }
            if (DECK_ROUTE_NAMES.has(this.route)) {
                this.ensureRemote('mcDeck');
            }
        } catch (error) {
            this.configurationError = error.message;
        }
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

        this.route = route;
        this.params = params;
        this.query = query;
        if (route !== 'match') {
            this.dialog = null;
        }
        console.log(route, params, query, data);
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

        const player = selectedMatch.players.find(({name}) => name === this.player) ||
            selectedMatch.players[0];
        this.player = player?.name || '';
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
       hand,
       title,
       subtitle,
       closeOnResponse,
       targetPlayer,
       callback,
   }) {
        if (targetPlayer && targetPlayer !== this.player) {
            return;
        }

        this.dialog = {
            dialogType,
            title,
            subtitle,
            data,
            callback,
            showCancel,
            hideOk,
            hand,
            closeOnResponse,
        };
    }
    handleViewDiscard(e) {
        const {cards, title} = e.detail;

        this.openDialog({
            dialogType: DIALOG_REVEAL_CARDS,
            title,
            subtitle: 'Ordenadas desde la carta superior hacia abajo.',
            data: {
                cards,
                rotatePlanCards: true,
            },
            callback: () => {},
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

        try {
            await currentDialog.callback();
        } catch (error) {
            if (this.dialog === currentDialog) {
                this.dialog = null;
            }
            this.showAlert(error.message);
            return;
        }

        if (this.dialog === currentDialog) {
            this.dialog = null;
        }
    }
    handleChangeMenu(e) {
        const {card, menuOptions, callback} = e.detail;

        this.openDialog({
            dialogType: 'list',
            showCancel: true,
            hideOk: true,
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
    handleCloseDialog() {
        if (this.dialog) {
            this.shadowRoot.getElementById('dialog').show();
        }
    }
    async handleDialogOk(e) {
        const {detail} = e;
        const currentDialog = this.dialog;

        try {
            const response = currentDialog.callback(detail);
            if (currentDialog.closeOnResponse && this.dialog === currentDialog) {
                this.dialog = null;
            }
            await response;
        } catch (error) {
            if (this.dialog === currentDialog) {
                this.dialog = null;
            }
            this.showAlert(error.message);
            return;
        }

        if (this.dialog === currentDialog) {
            this.dialog = null;
        }
    }
    handleCommunicationError(e) {
        this.showAlert(e.detail.message);
    }
    renderConnectionStatus() {
        const messages = {
            connecting: 'Conectando con el servidor...',
            disconnected: 'Conexión perdida. Intentando reconectar...',
            syncing: 'Conexión restablecida. Sincronizando la partida...',
            'sync-error': 'No se pudo sincronizar la partida con el servidor.',
        };
        const message = messages[this.connectionState];

        return message ? html`
            <div role="status" aria-live="polite">${message}</div>
        ` : '';
    }
    handleMatchChanged(e) {
        const {match} = e.detail;

        this.match = match;
    }
    handleSocketMatch(match) {
        this.match = match;
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

        this.pendingResumeMatch = '';
        this.gameOverNotice = '';
        this.match = match;
        this.player = player.name;

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

        this.player = player;
        if (resumedMatch) {
            this.match = resumedMatch;
            this.pendingResumeMatch = '';
            this.gameOverNotice = '';
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
    async handleResetMatch() {
        const match = this.match;
        if (this.resettingMatch || !match?.id || !window.confirm(
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
    handleExitMatch() {
        this.navigate(getNavigationPath('matches'));
    }
    renderDialog() {
        const {dialog} = this;
        let dialogElement = html``;
        let dialogClass = '';

        if (dialog) {
            const {
                dialogType,
                data,
                showCancel,
                hideOk,
                hand,
                title,
                subtitle,
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
                    .hand="${hand}"
                    @dialog-ok="${this.handleDialogOk.bind(this)}"
                    @dialog-cancel="${this.handleCancelDialog.bind(this)}"
                ></${tag}>`);
        }

        return html`
            <md-dialog
                id="dialog"
                class="dialog ${dialogClass}"
                ?open="${Boolean(dialog)}"
                @closed="${this.handleCloseDialog.bind(this)}"
            >${dialogElement}</md-dialog>
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
    render() {
        const {api, match, player} = this;

        return html`
          ${this.renderConnectionStatus()}
          ${this.route === 'match' ? html`
              <div class="match-actions">
                  <md-text-button
                      .disabled="${this.resettingMatch || !match?.id}"
                      @click="${this.handleResetMatch.bind(this)}"
                  >
                      ${this.resettingMatch ? 'Reiniciando...' : 'Reiniciar partida'}
                  </md-text-button>
                  <md-text-button @click="${this.handleExitMatch.bind(this)}">
                      Salir de la partida
                  </md-text-button>
              </div>
          ` : html`
              <mc-primary-navigation
                  .activeRoute="${this.route}"
                  @navigate-route="${this.handleNavigation.bind(this)}"
              ></mc-primary-navigation>
          `}

          ${this.appReady ? html`<mc-main .activeRoute="${this.route}">
              <div route='matches'>
                  <mc-create-match-page
                      .api="${api}"
                      .active="${this.route === 'matches'}"
                      .prepareMatch="${this.prepareMatch.bind(this)}"
                      @match-resume-requested="${this.handleMatchResumeRequested.bind(this)}"
                      @match-resumed="${this.handleMatchResumed.bind(this)}"
                      @communication-error="${this.handleCommunicationError.bind(this)}"
                  ></mc-create-match-page>
              </div>
              <div route='match'>
                  ${this.renderRemote('mcMatch', html`
                      <mc-match-page
                          .api="${api}"
                          .match="${match}"
                          player="${player}"
                          @change-menu="${this.handleChangeMenu.bind(this)}"
                          @turn-end-confirmation="${this.handleTurnEndConfirmation.bind(this)}"
                          @change-match="${this.handleMatchChanged.bind(this)}"
                          @view-discard="${this.handleViewDiscard.bind(this)}"
                          @communication-error="${this.handleCommunicationError.bind(this)}"
                      ></mc-match-page>
                  `)}
              </div>
              <div route='decks decks-create decks-edit-new decks-edit'>
                  ${this.renderRemote('mcDeck', html`
                      <mc-deck-app
                          .serviceUrl="${this.runtimeConfig?.services?.deck}"
                          .pageRoute="${this.route}"
                          .routeParams="${this.params}"
                          @navigate-route="${this.handleNavigation.bind(this)}"
                      ></mc-deck-app>
                  `)}
              </div>
              <h1 route='not-found'>Not Found </h1>
          </mc-main>` : html`
              <p role="${this.configurationError ? 'alert' : 'status'}">
                  ${this.configurationError ?
        `No se pudo cargar la configuración: ${this.configurationError}` :
        'Cargando la configuración de la aplicación...'}
              </p>
          `}
          ${this.renderDialog()}
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