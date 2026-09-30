import {html} from 'lit-element';

import styles from './mc-encounters-reveal-dialog.css.js';
import stylesDialog from '../mc-dialog/mc-dialog.css.js';
import '../../cards/mc-card/mc-card.js';
import {McDialog} from '../mc-dialog/mc-dialog.js';

export class McEncountersRevealDialog extends McDialog {
    static get is() {
        return 'mc-encounters-reveal-dialog';
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
                card: {},
            },
        };
    }
    getTitle() {
        return 'Mostrando carta de Encuentro';
    }
    renderContent() {
        const {data: {card}} = this;

        return html`
            <mc-card
                name="${card.name}"
                image="${card.image}"
                size="l"
            ></mc-card>
        `;
    }
}

window.customElements.define(McEncountersRevealDialog.is, McEncountersRevealDialog);
