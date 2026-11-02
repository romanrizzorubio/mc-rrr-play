import {LitElement, html} from 'lit-element';

import {renderTextWithFormatting} from '../../../utils/render-text-with-formatting.js';

export class McDialog extends LitElement {
    static get properties() {
        return {
            data: {type: Object},
            title: {type: String},
            subtitle: {type: String},
            footer: {type: String},
            showCancel: {type: Boolean},
            hideOk: {type: Boolean},
            readOnly: {type: Boolean},
            viewOnly: {type: Boolean},
            targetPlayerName: {type: String},

            _response: {type: Object},
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
        this.readOnly = false;
        this.viewOnly = false;
        this.targetPlayerName = '';

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
        if (this.readOnly || this.viewOnly) {
            return;
        }
        const {_response} = this;

        this.dispatchEvent(new CustomEvent('dialog-ok', {
            bubbles: true,
            composed: true,
            detail: _response
        }));
    }
    validate() {
        return true;
    }
    handleCancel() {
        if (this.readOnly || this.viewOnly) {
            return;
        }
        const {_response} = this;

        this.dispatchEvent(new CustomEvent('dialog-cancel', {
            bubbles: true,
            composed: true,
            detail: _response
        }));
    }
    handleViewTable() {
        this.dispatchEvent(new CustomEvent('dialog-view-table', {
            bubbles: true,
            composed: true,
        }));
    }
    handleCloseViewer() {
        this.dispatchEvent(new CustomEvent('dialog-viewer-close', {
            bubbles: true,
            composed: true,
        }));
    }
    handleOk() {
        if (this.readOnly || this.viewOnly) {
            return;
        }
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
            <div class="content">
                ${this.renderResponsiblePlayer()}
                ${this.renderSubtitle()}
                ${this.readOnly || this.viewOnly ? html`
                    <div inert>${this.renderContent()}</div>
                ` : this.renderContent()}
                ${this.renderFooter()}
            </div>
        `;
    }
    renderResponsiblePlayer() {
        return this.targetPlayerName ? html`
            <p class="dialog-responsible-player">
                Héroe responsable: ${this.targetPlayerName}
            </p>
        ` : html``;
    }
    renderFooter() {
        const footer = this.getFooter();

        return footer ? html`
            <h3 class="footer">${footer}</h3>
        ` : html``;
    }
    renderSubtitle() {
        const subtitle = this.getSubtitle();

        return subtitle ? html`
            <h3 class="subtitle">${subtitle}</h3>
        ` : html``;
    }
    renderTitle() {
        const title = this.getTitle();
        const titleContent = typeof title === 'string' ?
            renderTextWithFormatting(title) :
            title;

        return html`
            <h2 class="title">
                ${title ? html`<span>${titleContent}</span>` : ''}
                ${this.renderButtonTable()}
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
    renderButtonTable() {
        return html`
            <md-text-button 
                @click="${this.handleViewTable.bind(this)}"
            >Ver mesa</md-text-button>
        `;
    }
    renderButtonViewerClose() {
        return html`
            <md-text-button
                @click="${this.handleCloseViewer.bind(this)}"
            >Cerrar</md-text-button>
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
        if (this.viewOnly) {
            return this.renderButtonViewerClose();
        }
        if (this.readOnly) {
            return html``;
        }
        return html`
            ${this.renderButtonCancel()}
            ${this.renderButtonOk()}
        `;
    }
    render() {
        return html`
            <div class="dialog ${this.className}">
                ${this.renderDialog()}
                <div class="actions">
                    ${this.renderButtons()}
                </div>
            </div>
        `;
    }
}
