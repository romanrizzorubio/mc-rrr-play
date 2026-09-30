import {html} from 'lit-element';

import stylesDialog from '../mc-dialog/mc-dialog.css.js';
import styles from './mc-encounters-dealt-dialog.css.js';
import '../../cards/mc-card/mc-card.js';
import {McDialog} from '../mc-dialog/mc-dialog.js';
import {BACK_CARD_ENCOUNTER} from '../../../misc/cards.js';

export class McEncountersDealtDialog extends McDialog {
    static get is() {
        return 'mc-encounters-dealt-dialog';
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
                encounters: [],
            },
        };
    }
    getTitle() {
        return 'Encuentros repartidos';
    }
    _renderEncountersPlayer(player) {
        const {name, count} = player;

        return html`
            <mc-card
                name="${name}"
                image="${BACK_CARD_ENCOUNTER}"
            ></mc-card>
            <div>${count}</div>
        `;
    }
    renderContent() {
        const {data: {encounters}} = this;

        return encounters
            .map(this._renderEncountersPlayer.bind(this));
    }
}

window.customElements.define(McEncountersDealtDialog.is, McEncountersDealtDialog);
