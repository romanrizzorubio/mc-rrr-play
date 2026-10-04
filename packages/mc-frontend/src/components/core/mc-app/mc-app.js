import {html, unsafeStatic} from 'lit/static-html.js';
import {keyed} from 'lit/directives/keyed.js';
import { LitElement } from 'lit-element';
import { router, navigator, outlet } from 'lit-element-router';

import '../mc-navigate/mc-navigate.js';
import '../mc-main/mc-main.js';
import '../../../pages/mc-create-match-page/mc-create-match-page.js';
import '../../../pages/mc-match-page/mc-match-page.js';
import '../../dialog/index.js';
import '@material/web/dialog/dialog.js';
import {Api} from '../../api/api.js';
import {Dialog} from '../../api/dialog.js';
import stylesDialog from '../../dialog/mc-dialog/mc-dialog.css.js';
import {EVENTS} from 'mc-endpoints';
import {DIALOG_REVEAL_CARDS} from 'mc-shared';

class McApp extends router(navigator(outlet(LitElement))) {
    static get styles() {
        return [stylesDialog];
    }
    static get properties() {
        return {
            route: { type: String },
            params: { type: Object },
            query: { type: Object },
            api: {type: Api},
            match: {type: Object},
            player: {type: String, attribute: 'player'},
            dialog: {type: Object},
            alert: {type: Object},
            connectionState: {type: String},
        };
    }
    static get routes() {
        return [{
            name: 'matches',
            pattern: '',
        }, {
            name: 'create-match',
            pattern: 'create-match'
        }, {
            name: 'match',
            pattern: 'match'
        }, {
            name: 'not-found',
            pattern: '*'
        }];
    }

    constructor() {
        super();

        this.route = '';
        this.params = {};
        this.query = {};

        this.dialog = null;
        this.alert = null;
        this.connectionState = 'connecting';

        this.api = null;
        this.match = null;
        this.player = '';
        this.pendingResumeMatch = '';

        this.apiDialog = null;
        this.removeConnectionStateListener = null;
        this.removeCommunicationErrorListener = null;
        this.addEventListener(EVENTS.MATCH.CREATED, this.handleMatchCreated.bind(this));
    }
    connectedCallback() {
        super.connectedCallback();

        this.api = new Api();
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
            this.navigate('matches');
        } else if (route === 'match' &&
            (!match || this.api?.match !== match.name)) {
            this.navigate('matches');
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
       callback,
   }) {
        this.dialog = {
            dialogType,
            title,
            subtitle,
            data,
            callback,
            showCancel,
            hideOk,
            hand,
        };
    }
    handleViewDiscard(e) {
        const {cards, title} = e.detail;

        this.openDialog({
            dialogType: DIALOG_REVEAL_CARDS,
            title,
            subtitle: 'Ordenadas desde la carta superior hacia abajo.',
            data: {cards},
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
    handleCloseDialog() {
        if (this.dialog) {
            this.shadowRoot.getElementById('dialog').show();
        }
    }
    async handleDialogOk(e) {
        const {detail} = e;
        const currentDialog = this.dialog;

        try {
            await currentDialog.callback(detail);
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
        if (this.pendingResumeMatch === match.name && this.api.match === match.name) {
            this.pendingResumeMatch = '';
            this.navigate('match');
        }
    }
    handleMatchCreated(e) {
        const {match, player} = e.detail;

        this.pendingResumeMatch = '';
        this.match = match;
        this.player = player.name;

        this.navigate('match');
        this.api.joinMatch(true);
    }
    handleMatchResumeRequested(e) {
        const {matchName, player} = e.detail;

        this.player = player;
        this.pendingResumeMatch = matchName;
    }
    handleMatchResumed(e) {
        const {matchName, player} = e.detail;

        this.player = player;
        if (this.match?.name === matchName && this.pendingResumeMatch === matchName) {
            this.pendingResumeMatch = '';
            this.navigate('match');
        } else if (this.match?.name !== matchName) {
            this.pendingResumeMatch = matchName;
        }
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
          <mc-navigate href="/">Partidas</mc-navigate>
     
          <mc-main active-route=${this.route}>
              <div route='matches'>
                  <mc-create-match-page
                      .api="${api}"
                      .active="${this.route === 'matches'}"
                      @match-resume-requested="${this.handleMatchResumeRequested.bind(this)}"
                      @match-resumed="${this.handleMatchResumed.bind(this)}"
                      @communication-error="${this.handleCommunicationError.bind(this)}"
                  ></mc-create-match-page>
              </div>
              <div route='match'>
                  <mc-match-page
                      .api="${api}"
                      .match="${match}"
                      player="${player}"
                      @change-menu="${this.handleChangeMenu.bind(this)}"
                      @change-match="${this.handleMatchChanged.bind(this)}"
                      @view-discard="${this.handleViewDiscard.bind(this)}"
                      @communication-error="${this.handleCommunicationError.bind(this)}"
                  ></mc-match-page>
              </div>
              <h1 route='not-found'>Not Found </h1>
          </mc-main>
          ${this.renderDialog()}
          ${this.renderAlert()}
        `;
    }
}

    customElements.define('mc-app', McApp);