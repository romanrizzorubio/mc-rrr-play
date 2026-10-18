import {LitElement, html} from 'lit-element';
import {
    RESOURCE_ANY,
    RESOURCE_PAYMENT_MODE_DISCARD,
    RESOURCE_PAYMENT_MODE_PAYMENT,
} from 'mc-shared';

import styles from './mc-pay-cost.css.js';
import '../../cards/mc-card-list/mc-card-list.js';
import '../../common/mc-resource/mc-resource.js';
import {RESOURCE_WILD} from '../../../misc/resources.js';
import {BALL_STATUS_KO, BALL_STATUS_OK} from '../../common/mc-ball/mc-ball.js';
import {
    getPaymentResourceUnits,
    getResourceUnitKey,
} from '../../../utils/resource-payment.js';

export const PAY_COST_TYPE_GENERATOR = 'generators';
export const PAY_COST_TYPE_HAND = 'hand';

export class McPayCost extends LitElement {
    static get is() {
        return 'mc-pay-cost';
    }
    static get styles() {
        return styles;
    }
    static get properties() {
        return {
            cost: {type: String},
            resourceType: {type: String},
            requirement: {type: Array},
            resourcePaymentMode: {type: String},
            wilds: {type: Array},
            allowWildConversion: {type: Boolean},
            isPaid: {type: Boolean},
            allowPartial: {type: Boolean},
            validationError: {type: String},
            cards: {type: Object},
            resourceSelectionMode: {type: Boolean},
            selectedResources: {type: Array},
            _wilds: {type: Array},
        };
    }
    constructor() {
        super();

        this.cost = '';
        this.resourceType = undefined;
        this.requirement = [];
        this.resourcePaymentMode = RESOURCE_PAYMENT_MODE_PAYMENT;
        this.wilds = [];
        this.allowWildConversion = true;
        this.isPaid = false;
        this.allowPartial = false;
        this.validationError = '';
        this.cards = {
            generators: [],
            hand: []
        };
        this.resourceSelectionMode = false;
        this.selectedResources = undefined;
        this._wilds = [];
    }
    willUpdate(_changedProperties) {
        if (_changedProperties.has('wilds')) {
            this._wilds = this.wilds.slice();
        }
        if (_changedProperties.has('cards')) {
            this.cards.generators.forEach(card => {
                card.selected = !!card.selected;
            });
            this.cards.hand.forEach(card => {
                card.selected = !!card.selected;
            });
        }
        super.willUpdate(_changedProperties);
    }
    getResources(hand, generators) {
        return getPaymentResourceUnits(
            {hand, generators},
            {
                selectedOnly: true,
                selectedWilds: this._wilds,
                allowWildConversion: this.allowWildConversion !== false,
            }
        ).map(resource => ({...resource, used: false}));
    }
    handleResourceClick(e, unit) {
        const {resource, change} = e.detail;
        const {_wilds} = this;

        if (change) {
            const index = Number.isInteger(unit?.wildIndex) ?
                unit.wildIndex :
                _wilds.indexOf(change);
            if (index > -1) {
                _wilds.splice(index, 1, resource);
            }
        } else {
            _wilds.push(resource);
        }

        this._wilds = _wilds.slice();

        this.dispatchEvent(new CustomEvent('change-wild-resource', {
            composed: true,
            bubbles: true,
            detail: {
                wilds: this._wilds,
            }
        }));
    }
    handleResourceUnitToggle(key) {
        this.dispatchEvent(new CustomEvent('resource-unit-toggle', {
            bubbles: true,
            composed: true,
            detail: {key},
        }));
    }
    handleSelectGenerator(e) {
        const {card} = e.detail;

        this.dispatchEvent(new CustomEvent('pay-cost-select', {
            bubbles: true,
            composed: true,
            detail: {card, type: PAY_COST_TYPE_GENERATOR}
        }));
    }
    handleSelectHand(e) {
        const {card} = e.detail;

        this.dispatchEvent(new CustomEvent('pay-cost-select', {
            bubbles: true,
            composed: true,
            detail: {card, type: PAY_COST_TYPE_HAND}
        }));
    }
    renderResourceIcon(resource, disabled, wild = false, unit, selectable = true) {
        const isWild = wild || resource === RESOURCE_WILD;

        if (unit && this.resourceSelectionMode && selectable &&
            (!isWild || this.allowWildConversion === false)) {
            const key = getResourceUnitKey(unit);
            const selected = !Array.isArray(this.selectedResources) ||
                this.selectedResources.includes(key);

            return html`
                <button
                    class="resource-unit"
                    type="button"
                    aria-label="${selected ?
                        'Usar' :
                        'No usar'} recurso ${resource}"
                    aria-pressed="${selected}"
                    @click="${() => this.handleResourceUnitToggle(key)}"
                >${isWild ? html`
                    <mc-icon icon="${resource}" class="wild"></mc-icon>
                ` : html`
                    <mc-icon icon="${resource}"></mc-icon>
                `}
                </button>
            `;
        }

        return html`
            <mc-resource
                resource="${resource}"
                .disabled="${disabled}"
                .wild="${isWild}"
                .notChange="${isWild && this.allowWildConversion === false}"
                @resource-change="${e => this.handleResourceClick(e, unit)}"
            ></mc-resource>
        `;
    }
    renderResourceIcons(hand, generators) {
        const {allowPartial, requirement} = this;

        const render = [];
        if (requirement && requirement.some(req =>
            (Array.isArray(req) ? req : [req]).some(
                resource => resource !== RESOURCE_ANY
            ))) {
            render.push(html`Requisito: `);
        }

        const resources = this.getResources(hand, generators);

        if (requirement) {
            requirement.forEach(req => {
                const alternatives = Array.isArray(req) ? req : [req];
                if (alternatives.includes(RESOURCE_ANY)) {
                    return;
                }

                const paid = resources.find(r =>
                    (alternatives.includes(r.resource) ||
                        allowPartial &&
                        this.allowWildConversion &&
                        r.resource === RESOURCE_WILD) &&
                    !r.used
                );

                if (paid) {
                    paid.used = true;
                    render.push(this.renderResourceIcon(
                        paid.resource,
                        false,
                        paid.wild,
                        paid,
                        false
                    ));
                } else {
                    render.push(this.renderResourceIcon(alternatives[0], true));
                }
            });
        }

        resources.forEach(resource => {
            if (!resource.used) {
                render.push(this.renderResourceIcon(
                    resource.resource,
                    false,
                    resource.wild,
                    resource
                ));
            }
        });

        return render;
    }
    renderSubpanel(title, cards, handler, showGeneric = false) {
        return html`
            <div class="subpanel">
                <h5>
                    ${title}
                </h5>
                <mc-card-list
                    size="s"
                    .cards="${cards}"
                    .showGeneric="${showGeneric}"
                    @card-list-select="${handler}"
                ></mc-card-list>
            </div>
        `;
    }
    renderPanel(title, cards, selected = false, className = '') {
        if (cards) {
            const generators = this.resourcePaymentMode ===
                RESOURCE_PAYMENT_MODE_DISCARD ?
                [] :
                cards.generators.filter(card => card.selected === selected);
            const hand = cards.hand.filter(card => card.selected === selected);

            return html`
                <div class="panel">
                    <h4>${title}</h4>
                    <div class="subpanels ${className}">
                        ${generators.length ? this.renderSubpanel(
                            'Generadores',
                            generators,
                            this.handleSelectGenerator.bind(this),
                            true
                        ) : ''}
                        ${this.renderSubpanel('Mano', hand, this.handleSelectHand.bind(this))}
                    </div>
                </div>
            `;
        }

        return html``;
    }
    renderCost() {
        const {cost, cards, isPaid, allowPartial, validationError} = this;
        const costLabel = this.resourcePaymentMode ===
            RESOURCE_PAYMENT_MODE_DISCARD ?
            `Iconos a descartar: ${cost}` :
            allowPartial ?
            `Requisitos: ${cost} (paga todos los recursos posibles)` :
            `Coste: ${cost}`;

        if (cards) {
            const {hand, generators} = cards;
            const statusBall = isPaid ? BALL_STATUS_OK : BALL_STATUS_KO;

            return html`
                <div class="cost-panel-divider divider">
                    <h2 class="cost-panel">
                        <span><mc-ball status="${statusBall}"></mc-ball></span>
                        <span>${this.renderResourceIcons(hand, generators)}</span>
                        <span>${costLabel}</span>
                    </h2>
                    ${this.resourceSelectionMode ? html`
                        <p class="resource-selection-hint">
                            ${this.resourcePaymentMode === RESOURCE_PAYMENT_MODE_DISCARD ?
                                'Marca los iconos impresos que quieres descartar.' :
                                'Marca las unidades concretas que quieres gastar. Pulsa el comodín para cambiar el tipo que representa.'}
                        </p>
                    ` : ''}
                    ${validationError ? html`
                        <p class="payment-error" role="alert">${validationError}</p>
                    ` : ''}
                </div>
            `;
        }

        return html``;
    }
    render() {
        const {cards} = this;
        const isDiscardMode = this.resourcePaymentMode ===
            RESOURCE_PAYMENT_MODE_DISCARD;

        return html`
            ${this.renderCost()}
            ${this.renderPanel(
                isDiscardMode ? 'Descartado con' : 'Pagado con',
                cards,
                true,
                'divider'
            )}
            ${this.renderPanel(
                isDiscardMode ? 'Descartar con' : 'Pagar con',
                cards
            )}
        `;
    }
}

window.customElements.define(McPayCost.is, McPayCost);
