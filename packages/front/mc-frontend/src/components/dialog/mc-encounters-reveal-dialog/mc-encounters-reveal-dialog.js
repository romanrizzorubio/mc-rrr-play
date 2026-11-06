import {html} from 'lit-element';

import styles from './mc-encounters-reveal-dialog.css.js';
import stylesDialog from '../mc-dialog/mc-dialog.css.js';
import '../../cards/mc-card/mc-card.js';
import {McDialog} from '../mc-dialog/mc-dialog.js';
import {BACK_CARD_ENCOUNTER} from '../../../misc/cards.js';
import {isPlanCard} from '../../../misc/utils.js';
import {
    renderAmplificationIcons,
    renderBoostIcons,
} from '../../../utils/boost-icons.js';

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
        if (this.title === 'Esbirro enfrentado a') {
            return this.targetPlayerName ?
                `${this.title} ${this.targetPlayerName}` :
                this.title;
        }

        return this.title || 'Mostrando carta de Encuentro';
    }
    getSubtitle() {
        if (this.title === 'Esbirro enfrentado a') {
            return super.getSubtitle();
        }

        const shownType = this.data.isBoost ?
            'Aumento mostrado' :
            'Carta mostrada';
        const playerText = this.targetPlayerName ?
            `${shownType} por ${this.targetPlayerName}.` : '';
        return [super.getSubtitle(), playerText].filter(Boolean).join(' ');
    }
    renderResponsiblePlayer() {
        return html``;
    }
    renderContent() {
        const {
            data: {
                card,
                horizontal,
                isBoost,
                hasBoostAbility,
                appliedAmplificationIcons,
            },
        } = this;
        const isHorizontal = Boolean(horizontal || isPlanCard(card));
        const boostIcons = renderBoostIcons(card.boost);
        const amplificationIcons = renderAmplificationIcons(
            appliedAmplificationIcons
        );

        return html`
            ${isBoost && (boostIcons.length || amplificationIcons.length) ? html`
                <div class="boost-icons">
                    ${boostIcons.length ? html`
                        <div class="boost-icon-row">
                            <strong>Iconos de aumento</strong>
                            <span class="boost-icon-list">${boostIcons}</span>
                        </div>
                    ` : ''}
                    ${amplificationIcons.length ? html`
                        <div class="boost-amplification-row">
                            <strong>
                                Bonificador de amplificación
                                (+${appliedAmplificationIcons})
                            </strong>
                            <span class="boost-icon-list">
                                ${amplificationIcons}
                            </span>
                        </div>
                    ` : ''}
                </div>
            ` : ''}
            <div class="card-preview">
                <mc-card
                    name="${card.name}"
                    image="${card.image}"
                    .isFacedownCard="${card.isFacedownCard}"
                    .canPeekFacedown="${Boolean(!this.readOnly && card.isFacedownCard && card.image)}"
                    .facedownImage="${BACK_CARD_ENCOUNTER}"
                    size="l"
                    ?horizontal="${isHorizontal}"
                ></mc-card>
            </div>
            ${isBoost && hasBoostAbility ? html`
                <div class="boost-ability">
                    <strong>Capacidad de aumento</strong> Sí
                </div>
            ` : ''}
        `;
    }
}

window.customElements.define(McEncountersRevealDialog.is, McEncountersRevealDialog);
