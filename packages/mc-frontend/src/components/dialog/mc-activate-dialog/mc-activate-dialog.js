import {html} from 'lit-element';

import styles from './mc-activate-dialog.css.js';
import stylesDialog from '../mc-dialog/mc-dialog.css.js';
import '../../cards/mc-card/mc-card.js';
import {McDialog} from '../mc-dialog/mc-dialog.js';

export class McActivateDialog extends McDialog {
    static get is() {
        return 'mc-activate-dialog';
    }
    static get styles() {
        return [stylesDialog, styles];
    }
    constructor() {
        super(arguments[0]);
    }
    get className() {
        return 'activate';
    }
    get defaultProperties() {
        return {
            ...super.defaultProperties,
            data: {
                ...super.defaultProperties.data,
                character: null,
                target: null,
            },
        };
    }
    renderContent() {
        const {data: {character, target}} = this;

        return html`
            <mc-card
                name="${character.name}"
                image="${character.image}"
                size="l"
            ></mc-card>
            <div class="vs">VS</div>
            <mc-card
                name="${target.name}"
                image="${target.image}"
                size="l"
            ></mc-card>
        `;
    }
}

window.customElements.define(McActivateDialog.is, McActivateDialog);
