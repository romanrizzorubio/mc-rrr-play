import {LitElement, html} from 'lit-element';
import {RESOURCE_ANY} from 'mc-shared';

import styles from './mc-pay-cost.css.js';
import '../../cards/mc-card-list/mc-card-list.js';
import '../../common/mc-resource/mc-resource.js';
import {RESOURCE_WILD} from '../../../misc/resources.js';
import {BALL_STATUS_KO, BALL_STATUS_OK} from '../../common/mc-ball/mc-ball.js';

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
            isPaid: {type: Boolean},
            allowPartial: {type: Boolean},
            validationError: {type: String},
            cards: {type: Object},
            _wilds: {type: Array},
        };
    }
    constructor() {
        super();

        this.cost = '';
        this.resourceType = undefined;
        this.requirement = [];
        this.isPaid = false;
        this.allowPartial = false;
        this.validationError = '';
        this.cards = {
            generators: [],
            hand: []
        };
        this._wilds = [];
    }
    willUpdate(_changedProperties) {
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
        const _wilds = this._wilds.slice();

        const resources = [];
        hand.forEach(card => {
            if (card.selected) {
                card.resources.forEach(resource => {
                    resources.push({
                        resource,
                        used: false,
                    });
                });
            }
        });
        generators.forEach(card => {
            if (card.selected) {
                card.abilities.forEach(ability => {
                    if (ability.isResource) {
                        const generatedResources = ability.resources || [ability.resource];
                        generatedResources.forEach(resource => {
                            resources.push({
                                resource,
                                used: false,
                            });
                        });
                    }
                });
            }
        });

        return resources.map(r => {
            const resource = r.resource;
            if (resource === RESOURCE_WILD && _wilds.length) {
                return {
                    ...r,
                    resource: _wilds.shift(),
                    wild: true,
                };
            } else {
                return r;
            }
        });
    }
    handleResourceClick(e) {
        const {resource, change} = e.detail;
        const {_wilds} = this;

        if (change) {
            const index = _wilds.indexOf(change);
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
    renderResourceIcon(resource, disabled, wild = false) {
        return html`
            <mc-resource
                resource="${resource}"
                .disabled="${disabled}"
                .wild="${wild}"
                @resource-change="${this.handleResourceClick.bind(this)}"
            ></mc-resource>
        `;
    }
    renderResourceIcons(hand, generators) {
        const {allowPartial, requirement} = this;

        const render = [];
        if (requirement && requirement.some(req => req !== RESOURCE_ANY)) {
            render.push(html`Requisito: `);
        }

        const resources = this.getResources(hand, generators);

        if (requirement) {
            requirement.forEach(req => {
                if (req === RESOURCE_ANY) {
                    return;
                }

                const paid = resources.find(r =>
                    (r.resource === req ||
                        allowPartial && r.resource === RESOURCE_WILD) &&
                    !r.used
                );

                if (paid) {
                    paid.used = true;
                    render.push(this.renderResourceIcon(
                        paid.resource,
                        false,
                        paid.wild
                    ));
                } else {
                    render.push(this.renderResourceIcon(req, true));
                }
            });
        }

        resources.forEach(resource => {
            if (!resource.used) {
                render.push(this.renderResourceIcon(
                    resource.resource,
                    false,
                    resource.wild
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
            const generators = cards.generators.filter(card => card.selected === selected);
            const hand = cards.hand.filter(card => card.selected === selected);

            return html`
                <div class="panel">
                    <h4>${title}</h4>
                    <div class="subpanels ${className}">
                        ${this.renderSubpanel('Generadores', generators, this.handleSelectGenerator.bind(this), true)}
                        ${this.renderSubpanel('Mano', hand, this.handleSelectHand.bind(this))}
                    </div>
                </div>
            `;
        }

        return html``;
    }
    renderCost() {
        const {cost, cards, isPaid, allowPartial, validationError} = this;
        const costLabel = allowPartial ?
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

        return html`
            ${this.renderCost()}
            ${this.renderPanel('Pagado con', cards,true, 'divider')}
            ${this.renderPanel('Pagar con', cards)}
        `;
    }
}

window.customElements.define(McPayCost.is, McPayCost);
