import {html} from 'lit-element';

import styles from './mc-pay-cost-dialog.css.js';
import stylesDialog from '../mc-dialog/mc-dialog.css.js';

import "../../panels/mc-pay-cost/mc-pay-cost.js";

import {McDialog} from "../mc-dialog/mc-dialog.js";
import {RESOURCE_WILD} from "../../../misc/resources.js";
const COST_X = 'X';
export class McPayCostDialog extends McDialog {
    static get is() {
        return `mc-pay-cost-dialog`;
    }
    static get styles() {
        return [stylesDialog, styles];
    }
    constructor() {
        super(arguments[0]);
    }
    get className() {
        return 'large';
    }
    get cost() {
        const {data: {cost}} = this;
        const resources = this.resourcesType;

        if (cost === COST_X && resources.length) {
            return `${COST_X} (${resources.length})`;
        }

        return cost;
    }
    get defaultProperties() {
        return {
            data: {
                cost: 0,
                resourceType: undefined,
                requirement: [],
                cards: {
                    generators: [],
                    hand: []
                },
                wilds: [],
            },
            _response: {
                paid: {
                    generators: [],
                    hand: []
                },
                resources: []
            }
        };
    }
    get resources() {
        const {_response: {paid}} = this;

        const resources = [];
        if (paid) {
            const {hand, generators} = paid;

            if (hand) {
                hand.forEach(card => {
                    Array.prototype.push.apply(resources, card.resources);
                });
            }

            if (generators) {
                generators.forEach(card => {
                    card.abilities.forEach(ability => {
                        if (ability.isResource) {
                            resources.push(ability.resource);
                        }
                    });
                });
            }
        }

        return resources;
    }
    get resourcesConverted() {
        const {resources, data: {wilds}} = this;
        const _resources = [];

        const _wilds = wilds ? wilds.slice() : [];

        resources.forEach(_resource => {
            if (_resource === RESOURCE_WILD && _wilds.length) {
                _resources.push(_wilds.shift());
            } else {
                _resources.push(_resource);
            }
        });

        return _resources;
    }
    get resourcesType() {
        const {data: {cost, resourceType}} = this;
        const resources = this.resourcesConverted;

        if (cost === COST_X && resourceType) {
            return resources.filter(r => r === resourceType);
        }

        return resources;
    }
    getTitle() {
        return 'Pagar el coste';
    }
    sendResponse() {
        this._response = {
            ...this._response,
            resources: this.resourcesConverted,
        }

        super.sendResponse();
    }
    validate() {
        const {data: {cost, requirement, resourceType}} = this;
        const resources = this.resourcesType;

        if (cost === COST_X) {
            if (resources.length > 0) {
                return true;
            }
        } else {
            const costNumber = parseInt(cost);

            if (resources.length >= costNumber) {
                const _requirement = requirement.slice();

                resources.forEach(_resource => {
                    const index = _requirement.indexOf(_resource);
                    if (index > -1) {
                        _requirement.splice(index, 1);
                    }
                });

                return !_requirement.length;
            }
        }


        return false;
    }
    _handleChangeWildResource(e) {
        const {wilds} = e.detail;

        this.data = {
            ...this.data,
            wilds
        }
    }
    _handlePaySelect(e) {
        const {card, type} = e.detail;
        const {data: {cards}} = this;

        card.selected = !card.selected;

        this.data = {
            ...this.data,
            cards: {
                ...cards,
                [type]: cards[type].slice()
            }
        }

        this._response = {
            paid: {
                ...this._response.paid,
                [type]: cards[type].filter(_card => _card.selected)
            },
        };
    }
    renderContent() {
        const {cost, data: {cards, requirement, resourceType}, _response: {paid}} = this;
        const isPaid = this.validate();

        return html`
            <mc-pay-cost
                cost="${cost}"
                resourceType="${resourceType}"
                .requirement="${requirement}"
                .cards="${cards}"
                .paid="${paid}"
                .isPaid="${isPaid}"
                @pay-cost-select="${this._handlePaySelect.bind(this)}"
                @change-wild-resource="${this._handleChangeWildResource.bind(this)}"
            ></mc-pay-cost>
        `;
    }
}

window.customElements.define(McPayCostDialog.is, McPayCostDialog);
