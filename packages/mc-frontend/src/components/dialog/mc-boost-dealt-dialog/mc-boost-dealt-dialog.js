import {html} from 'lit-element';

import stylesDialog from '../mc-dialog/mc-dialog.css.js';
import '../../cards/mc-card/mc-card.js';
import {McDialog} from '../mc-dialog/mc-dialog.js';
import {BACK_CARD_ENCOUNTER} from '../../../misc/cards.js';

export class McBoostDealtDialog extends McDialog {
    static get is() {
        return 'mc-boost-dealt-dialog';
    }
    static get styles() {
        return [stylesDialog];
    }
    constructor() {
        super(arguments[0]);
    }
    renderContent() {
        return html`
            <mc-card
                name="Carta de aumento"
                image="${BACK_CARD_ENCOUNTER}"
                size="l"
            ></mc-card>
        `;
    }
}

window.customElements.define(McBoostDealtDialog.is, McBoostDealtDialog);
