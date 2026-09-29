import {html} from 'lit-element';

import styles from './mc-accelerate-dialog.css.js';
import stylesDialog from '../mc-dialog/mc-dialog.css.js';

import "../../cards/mc-card-list/mc-card-list.js";

import {McDialog} from "../mc-dialog/mc-dialog.js";
import {ICON_ADVANCE} from "../../common/mc-icon/mc-icon.js";
export class McAccelerateDialog extends McDialog {
    static get is() {
        return `mc-accelerate-dialog`;
    }
    static get styles() {
        return [stylesDialog, styles];
    }
    constructor() {
        super(arguments[0]);
    }
    get defaultProperties() {
        return {
            ...super.defaultProperties,
            data: {
                ...super.defaultProperties,
                cards: null,
                accelerate: 0,
                accelerateBase: 0,
                accelerateIcons: 0,
                accelerateTokens: 0,
            },
        };
    }
    getTitle() {
        return 'El Plan se acelera';
    }
    renderContent() {
        const {data: {cards, accelerate, accelerateBase, accelerateIcons, accelerateTokens}} = this;

        return html`
            <mc-card-list
                .cards="${cards}"
            ></mc-card-list>
            <div class="accelerate-value">Total: ${accelerate}</div>
            <div class="accelerate-base">Valor base: ${accelerateBase}</div>
            <div class="accelerate-modify">
                <div class="accelerate-icons">
                    <div class="title">Íconos</div>
                    <div class="value">${accelerateIcons}</div>
                </div>
                <mc-icon icon="${ICON_ADVANCE}" size="xl"></mc-icon>
                <div class="accelerate-tokens">
                    <div class="title">Fichas</div>
                    <div class="value">${accelerateTokens}</div>
                </div>
            </div>
        `;
    }
}

window.customElements.define(McAccelerateDialog.is, McAccelerateDialog);
