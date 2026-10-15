import {LitElement, html} from 'lit-element';

import {RESOURCE_ENERGY, RESOURCE_MENTAL, RESOURCE_PHYSICAL, RESOURCE_WILD} from '../../../misc/resources.js';
import {getStaticAssetUrl} from '../../../utils/remotes.js';

import styles from './mc-icon.css.js';


export const ICON_ADVANCE = 'A';
export const ICON_CRISIS = 'C';
export const ICON_HAZARD = 'H';
export const ICON_AMPLIFICATION = 'F';
export const ICON_BOOST = 'b';
export const ICON_STAR = 's';
export const ICON_EYE = 'eye';
export const ICON_EYE_SLASH = 'eye-slash';
export const ICON_MENTAL = RESOURCE_MENTAL;
export const ICON_PHYSICAL = RESOURCE_PHYSICAL;
export const ICON_ENERGY = RESOURCE_ENERGY;
export const ICON_WILD = RESOURCE_WILD;

const SVG_ICON_ASSETS = {
    [ICON_EYE]: 'icons/eye.svg',
    [ICON_EYE_SLASH]: 'icons/eye-slash.svg',
};

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

    renderSvgIcon(icon) {
        const asset = SVG_ICON_ASSETS[icon];
        if (asset) {
            return html`
                <img
                    class="mc-icon-svg"
                    src="${getStaticAssetUrl(asset)}"
                    alt=""
                    aria-hidden="true"
                >
            `;
        }

        return icon;
    }

    render() {
        const {icon, disabled} = this;

        const className = disabled ? 'disabled' : '';

        return html`
            <span class="mc-icon ${icon} ${className}">
                ${this.renderSvgIcon(icon)}
            </span>
        `;
    }
}

window.customElements.define(McIcon.is, McIcon);
