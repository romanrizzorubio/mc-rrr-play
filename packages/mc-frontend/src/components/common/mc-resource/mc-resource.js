import {LitElement, html} from 'lit-element';
import styles from './mc-resource.css.js';

import '../mc-icon/mc-icon.js';
import {RESOURCE_ENERGY, RESOURCE_MENTAL, RESOURCE_PHYSICAL, RESOURCE_WILD} from "../../../misc/resources.js";

export class McResource extends LitElement {
    static get is() {
        return 'mc-resource';
    }
    static get styles() {
        return styles;
    }

    static get properties() {
        return {
            resource: {type: String},
            disabled: {type: Boolean},
            wild: {type: Boolean},
            notChange: {type: Boolean, attribute: 'not-change'},
            _menuOpen: {type: Boolean},
        };
    }

    constructor() {
        super();

        this.resource = '';
        this.disabled = false;
        this.wild = false;
        this.notChange = false;
        this._menuOpen = false;
    }

    get _icon() {
        return this.renderRoot?.querySelector('#icon') ?? null;
    }
    get _menu() {
        return this.renderRoot?.querySelector('#menu') ?? null;
    }

    firstUpdated(properties) {
        super.firstUpdated(properties);

        if (this._menu) {
            this._menu.anchorElement = this._icon;
        }
    }

    handleClick(e) {
        e.stopPropagation();
        if (!this.disabled && (this.resource === RESOURCE_WILD || this.wild)) {
            this._menuOpen = true;
        }
    }

    handleClickMenu(resource) {
        return e => {
            e.stopPropagation();

            this.dispatchEvent(new CustomEvent('resource-change', {
                bubbles: true,
                composed: true,
                detail: {
                    resource,
                    change: this.wild ? this.resource : '',
                }
            }));

            this._menuOpen = false;
        }
    }

    handleCloseMenu() {
        this._menuOpen = false;
    }

    renderMenuOption(resource) {
        return html`
            <md-menu-item
                @click="${this.handleClickMenu(resource)}"
            >
                <mc-resource
                    resource="${resource}"
                    not-change
                    slot="headline"
                    @click="${this.handleClickMenu(resource)}"
                ></mc-resource>
            </md-menu-item>
        `;
    }

    renderMenuOptions() {
        return [RESOURCE_ENERGY, RESOURCE_MENTAL, RESOURCE_PHYSICAL].map(this.renderMenuOption.bind(this));
    }

    renderMenu() {
        return this.notChange ? html`` : html`
            <md-menu 
                id="menu" 
                .open="${this._menuOpen}"
                @closing="${this.handleCloseMenu}"
            >
                ${this.renderMenuOptions()}
            </md-menu>
        `;
    }

    renderIcon() {
        const {resource, disabled, wild} = this;

        return html`
            <mc-icon
                id="icon"
                icon="${resource}"
                .disabled="${disabled}"
                @click="${this.handleClick.bind(this)}"
            ></mc-icon>
        `;
    }

    renderWild() {
        const {resource, disabled} = this;

        return html`
            <mc-icon
                id="icon"
                class="wild"
                icon="${resource}"
                .disabled="${disabled}"
                @click="${this.handleClick.bind(this)}"
            ></mc-icon>
        `;
    }

    render() {
        const {wild} = this;

        const icon = wild ?
            this.renderWild() :
            this.renderIcon();

        return html`
            ${icon}
            ${this.renderMenu()}
        `;
    }
}

window.customElements.define(McResource.is, McResource);
