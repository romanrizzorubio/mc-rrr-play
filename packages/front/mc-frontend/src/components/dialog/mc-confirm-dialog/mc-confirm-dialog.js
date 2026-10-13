import {html} from 'lit-element';

import '../../cards/mc-card/mc-card.js';
import stylesDialog from '../mc-dialog/mc-dialog.css.js';
import styles from './mc-confirm-dialog.css.js';
import {McDialog} from '../mc-dialog/mc-dialog.js';
import {isPlanCard} from '../../../misc/utils.js';
import {renderBoostIcons} from '../../../utils/boost-icons.js';

export class McConfirmDialog extends McDialog {
    static get properties() {
        return {
            ...super.properties,
            _dontShowBasicActivationConfirmation: {type: Boolean},
        };
    }
    static get is() {
        return 'mc-confirm-dialog';
    }
    static get styles() {
        return [stylesDialog, styles];
    }
    get className() {
        return 'confirm';
    }
    getTitle() {
        const {basicActivation} = this.data;

        if (basicActivation) {
            const titles = {
                attack: '¿Quieres realizar este ataque?',
                thwart: '¿Quieres realizar esta intervención?',
            };

            return titles[basicActivation.activationType] ?? super.getTitle();
        }

        return super.getTitle();
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
    renderSubtitle() {
        return this.data.basicActivation ? '' : super.renderSubtitle();
    }
    constructor() {
        super(arguments[0]);

        this._dontShowBasicActivationConfirmation = false;
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
                basicActivation,
            },
        } = this;

        if (basicActivation) {
            return html`
                <div class="basic-activation-preview">
                    ${this.renderBasicActivationCard(
                        basicActivation.superhero
                    )}
                    ${this.renderBasicActivationCard(
                        basicActivation.target
                    )}
                </div>
                <label class="remember-choice">
                    <input
                        type="checkbox"
                        .checked="${this._dontShowBasicActivationConfirmation}"
                        @change="${this.handleDontShowBasicActivationConfirmationChange.bind(this)}"
                    >
                    <span>No volver a mostrar este diálogo durante esta partida</span>
                </label>
            `;
        }

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
    renderBasicActivationCard(card) {
        const showThreat = Boolean(
            card.isScheme || card.isSideScheme || card.isMainScheme
        );

        return html`
            <div class="basic-activation-card">
                <mc-card
                    .name="${card.name}"
                    .image="${card.image}"
                    .isFacedownCard="${card.isFacedownCard}"
                    .life="${card.life}"
                    .hitPoints="${card.hitPoints}"
                    .attack="${card.attack}"
                    .thwart="${card.thwart}"
                    .defense="${card.defense}"
                    .recovery="${card.recovery}"
                    .scheme="${card.scheme}"
                    .unprintedStats="${card.unprintedStats ?? []}"
                    .threat="${card.threat}"
                    .showThreat="${showThreat}"
                    size="l"
                    show-basic-stats
                    .horizontal="${isPlanCard(card)}"
                ></mc-card>
            </div>
        `;
    }
    handleDontShowBasicActivationConfirmationChange(e) {
        this._dontShowBasicActivationConfirmation = e.target.checked;
    }
    renderButtonCancel() {
        const {
            data: {
                cancelText,
                preventedDamage,
                defenseBonus,
                boostIconCount,
                basicActivation,
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
                        basicActivation ? 'Cancelar' : 'No, seguir jugando')}
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
                basicActivation,
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
                        basicActivation ? 'Ok' : 'Sí, finalizar el turno')}
            </md-text-button>
        `;
    }
    sendResponse() {
        const response = {confirmed: true};

        if (this.data.basicActivation &&
            this._dontShowBasicActivationConfirmation) {
            response.skipBasicActivationConfirmation = true;
        }

        this.dispatchEvent(new CustomEvent('dialog-ok', {
            bubbles: true,
            composed: true,
            detail: response,
        }));
    }
}

window.customElements.define(McConfirmDialog.is, McConfirmDialog);
