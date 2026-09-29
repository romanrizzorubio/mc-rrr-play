import {LitElement, html} from 'lit-element';
import styles from './mc-icon.css.js';
import {RESOURCE_ENERGY, RESOURCE_MENTAL, RESOURCE_PHYSICAL, RESOURCE_WILD} from "../../../misc/resources.js";

export const ICON_ADVANCE = 'A';
export const ICON_CRISIS = 'C';
export const ICON_HAZARD = 'H';
export const ICON_AMPLIFICATION = 'F';
export const ICON_MENTAL = RESOURCE_MENTAL;
export const ICON_PHYSICAL = RESOURCE_PHYSICAL;
export const ICON_ENERGY = RESOURCE_ENERGY;
export const ICON_WILD = RESOURCE_WILD;

export class McIcon extends LitElement {
    static get is() {
        return 'mc-icon';
    }
    static get styles() {
        return styles;
    }

    static get properties() {
        return {
            icon:{type: String},
            disabled: {type: Boolean},
        };
    }

    constructor() {
        super(arguments[0]);

        this.icon = '';
        this.disabled = false;
    }

    render() {
        const {icon, disabled} = this;

        const className = disabled ? 'disabled' : '';

        return html`
            <span class="mc-icon ${icon} ${className}">
                ${icon}
            </span>
        `;
    }
}

window.customElements.define(McIcon.is, McIcon);
