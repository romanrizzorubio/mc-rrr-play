import {html} from 'lit-element';

import '../../cards/mc-card/mc-card.js';
import stylesDialog from '../mc-dialog/mc-dialog.css.js';
import styles from './mc-confirm-dialog.css.js';
import {McDialog} from '../mc-dialog/mc-dialog.js';
import {isPlanCard} from '../../../misc/utils.js';
import {renderBoostIcons} from '../../../utils/boost-icons.js';

export class McConfirmDialog extends McDialog {
    static get is() {
        return 'mc-confirm-dialog';
    }
    static get styles() {
        return [stylesDialog, styles];
    }
    get className() {
        return 'confirm';
    }
    getSubtitle() {
        const {
            preventedDamage,
            defenseBonus,
            boostIconCount,
        } = this.data;

        return this.subtitle ||
            (preventedDamage !== undefined || defenseBonus !== undefined ?
                '¿Continuar con esta Interrupción?' :
                boostIconCount !== undefined ?
                    '¿Continuar y pagar el coste del evento?' :
                    super.getSubtitle());
    }
    renderContent() {
        const {
            data: {
                reasons = [],
                card,
                horizontal,
                boostIconCount,
                boostIconLabel,
                preventedDamage,
                preventedDamageLabel,
                defenseBonus,
            },
        } = this;
        const boostIcons = renderBoostIcons(boostIconCount);
        const isHorizontal = Boolean(card &&
            (horizontal || isPlanCard(card)));

        return html`
            ${card ? html`
                <div class="card-preview">
                    <mc-card
                        name="${card.name}"
                        image="${card.image}"
                        .isFacedownCard="${card.isFacedownCard}"
                        size="l"
                        ?horizontal="${isHorizontal}"
                    ></mc-card>
                </div>
            ` : ''}
            ${boostIcons.length ? html`
                <div class="boost-icons">
                    <strong>
                        ${boostIconLabel ?? 'Iconos de aumento que se cancelarán'}:
                    </strong>
                    <span class="boost-icon-list">${boostIcons}</span>
                </div>
            ` : ''}
            ${defenseBonus ? html`
                <div class="defense-bonus-preview">
                    <p>
                        <strong>ATQ de ${defenseBonus.enemyName} (sin aumentos):</strong>
                        ${defenseBonus.attackValue}
                    </p>
                    <p>
                        <strong>
                            DEF de ${defenseBonus.defenderName} antes del bonificador:
                        </strong>
                        ${defenseBonus.defenseValue}
                    </p>
                    <p>
                        <strong>Aumento de DEF:</strong>
                        +${defenseBonus.bonus}
                    </p>
                    <p>
                        <strong>DEF después del bonificador:</strong>
                        ${defenseBonus.totalDefense}
                    </p>
                </div>
            ` : ''}
            ${preventedDamage !== undefined ? html`
                <ul class="reasons" aria-label="Motivos de la confirmación">
                    <li>
                        ${preventedDamageLabel ?? 'Daño que se evitará'}:
                        ${preventedDamage}
                    </li>
                </ul>
            ` : ''}
            ${reasons.length ? html`
                <ul class="reasons" aria-label="Motivos de la confirmación">
                    ${reasons.map(reason => html`<li>${reason}</li>`)}
                </ul>
            ` : ''}
        `;
    }
    renderButtonCancel() {
        const {
            data: {
                cancelText,
                preventedDamage,
                defenseBonus,
                boostIconCount,
            },
        } = this;
        const isPrePlayConfirmation = preventedDamage !== undefined ||
            defenseBonus !== undefined ||
            boostIconCount !== undefined;

        return html`
            <md-text-button @click="${this.handleCancel.bind(this)}">
                ${cancelText ??
                    (isPrePlayConfirmation ?
                        'Cancelar' :
                        'No, seguir jugando')}
            </md-text-button>
        `;
    }
    renderButtonOk() {
        const {
            data: {
                okText,
                preventedDamage,
                defenseBonus,
                boostIconCount,
            },
        } = this;
        const isPrePlayConfirmation = preventedDamage !== undefined ||
            defenseBonus !== undefined ||
            boostIconCount !== undefined;

        return html`
            <md-text-button @click="${this.handleOk.bind(this)}">
                ${okText ??
                    (isPrePlayConfirmation ?
                        'OK' :
                        'Sí, finalizar el turno')}
            </md-text-button>
        `;
    }
    sendResponse() {
        this.dispatchEvent(new CustomEvent('dialog-ok', {
            bubbles: true,
            composed: true,
            detail: {confirmed: true},
        }));
    }
}

window.customElements.define(McConfirmDialog.is, McConfirmDialog);
