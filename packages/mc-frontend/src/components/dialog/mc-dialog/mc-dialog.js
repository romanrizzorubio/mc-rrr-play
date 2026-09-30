import {LitElement, html} from 'lit-element';

import '../../cards/mc-card-list/mc-card-list.js';
import '@material/web/dialog/dialog.js';
import '@material/web/button/text-button.js';

export class McDialog extends LitElement {
    static get properties() {
        return {
            data: {type: Object},
            title: {type: String},
            subtitle: {type: String},
            footer: {type: String},
            showCancel: {type: Boolean},
            hideOk: {type: Boolean},
            hand: {type: Array},

            _response: {type: Object},
            _showHand: {type: Boolean},
        };
    }
    constructor() {
        super();

        this.data = {};
        this.title = '';
        this.subtitle = '';
        this.footer = '';
        this.showCancel = false;
        this.hideOk = false;
        this.hand = [];
        this._showHand = false;

        this._response = {};
    }
    connectedCallback() {
        super.connectedCallback();

        this.initProperties();
    }
    get defaultProperties() {
        return {
            data: {},
            _response: {},
        };
    }
    get className() {
        return '';
    }
    getFooter() {
        return this.footer;
    }
    getSubtitle() {
        return this.subtitle;
    }
    getTitle() {
        return this.title;
    }
    initDefaultData(data, defaultData) {
        const _clone = obj => {
            if (obj instanceof Array) {
                return obj.map(_clone);
            } else if (typeof obj === 'object' && obj !== null) {
                return Object.keys(obj).reduce((r, key) => {
                    return {
                        ...r,
                        [key]: _clone(obj[key])
                    };
                }, {});
            } else {
                return obj;
            }
        };

        Object.keys(defaultData.data).forEach(key => {
            if (data[key] === undefined &&
                defaultData.data[key] !== undefined) {
                data[key] = _clone(defaultData.data[key]);
            }
        });

        this._response = _clone(defaultData._response);

        this.data = {
            ...this.data,
            ...data,
        };
    }
    initProperties() {
        const {data} = this;

        this.initDefaultData(data, this.defaultProperties);
    }
    sendResponse() {
        const {_response} = this;

        this.dispatchEvent(new CustomEvent('dialog-ok', {
            bubbles: true,
            composed: true,
            detail: _response
        }));
    }
    show() {
        const dialog = this.shadowRoot.getElementById('dialog');

        dialog.show();
    }
    validate() {
        return true;
    }
    handleClose() {
        this.dispatchEvent(new CustomEvent('dialog-close', {
            bubbles: true,
            composed: true,
        }));
    }
    handleCancel() {
        const {_response} = this;

        this.dispatchEvent(new CustomEvent('dialog-cancel', {
            bubbles: true,
            composed: true,
            detail: _response
        }));
    }
    handleShowHand() {
        this._showHand = !this._showHand;
    }
    handleOk() {
        if (this.validate()) {
            this.sendResponse();
        }
    }
    renderContent() {
        return '';
    }
    renderDialog() {
        return html`
            ${this.renderTitle()}
            <div class="content" slot="content">
                ${this.renderSubtitle()}
                ${this._showHand ? this.renderHand() : this.renderContent()}
                ${this.renderFooter()}
            </div>
        `;
    }
    renderFooter() {
        const footer = this.getFooter();

        return html`
            <h3 class="footer">${footer}</h3>
        `;
    }
    renderHand() {
        const {hand} = this;

        return html`
            <mc-card-list
                .cards="${hand}"
            ></mc-card-list>
        `;
    }
    renderSubtitle() {
        const subtitle = this.getSubtitle();

        return html`
            <h3 class="subtitle">${subtitle}</h3>
        `;
    }
    renderTitle() {
        const {hand} = this;

        const title = this.getTitle();

        return html`
            <h2 class="title" slot="headline">
                <span>${title}</span>
                ${hand && hand.length ? this.renderButtonHand() : ''}
            </h2>
        `;
    }
    renderButtonCancel() {
        const {showCancel} = this;

        return showCancel ? html`
            <md-text-button 
                @click="${this.handleCancel.bind(this)}"
            >Cancelar</md-text-button>
        ` : html``;
    }
    renderButtonHand() {
        const title = this._showHand ? 'Ocultar mano' : 'Ver mano';

        return html`
            <md-text-button 
                @click="${this.handleShowHand.bind(this)}"
            >${title}</md-text-button>
        `;
    }
    renderButtonOk() {
        const {hideOk} = this;

        return !hideOk ? html`
            <md-text-button 
                @click="${this.handleOk.bind(this)}"
            >Ok</md-text-button>
        ` : html``;
    }
    renderButtons() {
        return html`
            ${this.renderButtonCancel()}
            ${this.renderButtonOk()}
        `;
    }
    render() {
        return html`
            <md-dialog 
                id="dialog" 
                class="dialog ${this.className}" 
                open 
                @closed="${this.handleClose.bind(this)}"
            >
                ${this.renderDialog()}
                <div slot="actions">
                    ${this.renderButtons()}
                </div>
            </md-dialog>
        `;
    }
}
