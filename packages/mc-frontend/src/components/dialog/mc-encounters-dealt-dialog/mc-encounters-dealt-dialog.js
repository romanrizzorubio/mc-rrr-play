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
                hazardIcons: 0,
            },
        };
    }
    getTitle() {
        return 'Encuentros repartidos';
    }
    getSubtitle() {
        const {hazardIcons} = this.data;

        if (!hazardIcons) {
            return '';
        }

        if (hazardIcons === 1) {
            return 'Se reparte 1 carta de encuentro adicional por el icono de riesgo.';
        }

        return `Se reparten ${hazardIcons} cartas de encuentro adicionales por los iconos de riesgo.`;
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
