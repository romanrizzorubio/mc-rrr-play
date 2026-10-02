import {html} from 'lit-element';

import '../../cards/mc-card-list/mc-card-list.js';
import {McDialog} from '../mc-dialog/mc-dialog.js';
import stylesDialog from '../mc-dialog/mc-dialog.css.js';
import styles from './mc-reveal-cards-dialog.css.js';

export class McRevealCardsDialog extends McDialog {
    static get is() {
        return 'mc-reveal-cards-dialog';
    }
    static get styles() {
        return [stylesDialog, styles];
    }
    get defaultProperties() {
        return {
            ...super.defaultProperties,
            data: {
                ...super.defaultProperties.data,
                cards: [],
            },
        };
    }
    renderContent() {
        const {data: {cards}} = this;

        return html`
            <mc-card-list
                .cards="${cards}"
            ></mc-card-list>
        `;
    }
    renderButtons() {
        return html`
            <md-text-button
                @click="${this.handleOk.bind(this)}"
            >Continuar</md-text-button>
        `;
    }
}

window.customElements.define(McRevealCardsDialog.is, McRevealCardsDialog);
