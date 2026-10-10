import {html} from 'lit-element';

import styles from './mc-encounters-reveal-dialog.css.js';
import stylesDialog from '../mc-dialog/mc-dialog.css.js';
import '../../cards/mc-card/mc-card.js';
import {McDialog} from '../mc-dialog/mc-dialog.js';
import {isPlanCard} from '../../../misc/utils.js';
import {renderBoostIcons} from '../../../utils/boost-icons.js';

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
        return this.title || 'Mostrando carta de Encuentro';
    }
    renderContent() {
        const {data: {card, horizontal, isBoost, hasBoostAbility}} = this;
        const isHorizontal = Boolean(horizontal || isPlanCard(card));
        const boostIcons = renderBoostIcons(card.boost);

        return html`
            ${isBoost && boostIcons.length ? html`
                <div class="boost-icons">
                    <strong>Iconos de aumento:</strong>
                    <span class="boost-icon-list">${boostIcons}</span>
                </div>
            ` : ''}
            <mc-card
                name="${card.name}"
                image="${card.image}"
                .isFacedownCard="${card.isFacedownCard}"
                size="l"
                ?horizontal="${isHorizontal}"
            ></mc-card>
            ${isBoost && hasBoostAbility ? html`
                <div class="boost-ability">
                    <strong>Capacidad de aumento:</strong> Sí
                </div>
            ` : ''}
        `;
    }
}

window.customElements.define(McEncountersRevealDialog.is, McEncountersRevealDialog);
