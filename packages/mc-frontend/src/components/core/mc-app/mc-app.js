import { LitElement } from 'lit-element';
import {html, unsafeStatic} from 'lit/development/static-html.js';
import { router, navigator, outlet } from 'lit-element-router';

import '../mc-navigate/mc-navigate.js';
import '../mc-main/mc-main.js';
import '../../../pages/mc-create-match-page/mc-create-match-page.js';
import '../../../pages/mc-match-page/mc-match-page.js';

import '../../dialog/index.js';

import {Api} from "../../api/api.js";
import {Dialog} from "../../api/dialog.js";

class McApp extends router(navigator(outlet(LitElement))) {
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
        };
    }
    static get routes() {
        return [{
            name: 'home',
            pattern: '',
            data: { title: 'Home' }
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

        this.api = null;
        this.match = null;
        this.player = '';

        this.apiDialog = null;
    }
    connectedCallback() {
        super.connectedCallback();

        this.api = new Api();
        this.api.init();

        this.apiDialog = new Dialog(this.api);

        this.apiDialog.listenDialog(this.openDialog.bind(this));
    }
    router(route, params, query, data) {
        const {match} = this;

        this.route = route;
        this.params = params;
        this.query = query;
        console.log(route, params, query, data);
        if (route === 'match' && !match) {
            this.navigate('create-match')
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
        }
    }
    showAlert(msg) {
        this.alert = {
            msg,
            open: true
        }
    }
    handleAlertOk() {
        this.alert = null;
    }
    handleCancelDialog() {
        const {dialog: {callback}} = this;

        this.dialog = null;

        callback();
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
        })
    }
    handleCloseDialog() {
        const dialog = this.shadowRoot.getElementById('dialog');

        dialog.show();
    }
    handleDialogOk(e) {
        const {detail} = e;
        const {dialog: {callback}} = this;

        this.dialog = null;

        callback(detail);
    }
    handleMatchChanged(e) {
        const {match} = e.detail;

        this.match = match;
    }
    handleMatchCreated(e) {
        const {match, player} = e.detail;

        this.match = match;
        this.player = player.name;

        this.navigate('match')
    }
    renderDialog() {
        const {dialog} = this;

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

            return html`<${tag}
                id="dialog"
                title="${title}"
                subtitle="${subtitle}"
                .data="${data}"
                .showCancel="${showCancel}"
                .hideOk="${hideOk}"
                .hand="${hand}"
                @dialog-ok="${this.handleDialogOk.bind(this)}"
                @dialog-close="${this.handleCloseDialog.bind(this)}"
                @dialog-cancel="${this.handleCancelDialog.bind(this)}"
            ></${tag}>`;
        }

        return html``;
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
          <mc-navigate href="/">Home</mc-navigate>
          <mc-navigate href="/create-match">Crear Partida</mc-navigate>
     
          <mc-main active-route=${this.route}>
              <h1 route='home'>Home</h1>
              <div route='create-match'>
                  <mc-create-match-page
                      .api="${api}"
                      @match-created="${this.handleMatchCreated.bind(this)}"
                  ></mc-create-match-page>
              </div>
              <div route='match'>
                  <mc-match-page
                      .api="${api}"
                      .match="${match}"
                      player="${player}"
                      @change-menu="${this.handleChangeMenu.bind(this)}"
                      @change-match="${this.handleMatchChanged.bind(this)}"
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