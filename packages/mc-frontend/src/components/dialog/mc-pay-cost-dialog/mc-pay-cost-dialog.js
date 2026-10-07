import {html} from 'lit-element';
import {RESOURCE_ANY} from 'mc-shared';

import stylesDialog from '../mc-dialog/mc-dialog.css.js';
import styles from './mc-pay-cost-dialog.css.js';
import '../../panels/mc-pay-cost/mc-pay-cost.js';
import '../../cards/mc-card-image/mc-card-image.js';
import {McDialog} from '../mc-dialog/mc-dialog.js';
import {CARD_PATH} from '../../../misc/cards.js';
import {RESOURCE_WILD} from '../../../misc/resources.js';
import {isPlanCard} from '../../../misc/utils.js';

const COST_X = 'X';

export class McPayCostDialog extends McDialog {
    static get properties() {
        return {
            ...super.properties,
            showValidationError: {type: Boolean},
        };
    }
    static get is() {
        return 'mc-pay-cost-dialog';
    }
    static get styles() {
        return [stylesDialog, styles];
    }
    constructor() {
        super(arguments[0]);

        this.showValidationError = false;
    }
    get className() {
        return 'large pay-cost';
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
                allowPartial: false,
                resourceType: undefined,
                requirement: [],
                card: undefined,
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
                resources: [],
                fullyPaid: false,
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
                            const generatedResources = ability.resources || [ability.resource];
                            Array.prototype.push.apply(resources, generatedResources);
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
        const {allowPartial, card} = this.data;
        const action = allowPartial ?
            'Pagar los recursos posibles de' :
            'Pagar el coste de';

        return card && card.name ?
            `${action} ${card.name}` :
            allowPartial ? 'Pagar los recursos posibles' : 'Pagar el coste';
    }
    getPaymentResourceUnits(
        cards,
        selectedOnly = false,
        selectedWilds = selectedOnly ? (this.data.wilds || []).slice() : []
    ) {
        const {generators, hand} = cards;
        const selected = selectedOnly ?
            card => card.selected :
            () => true;
        const addResourceUnits = (card, resources, units) => {
            resources.forEach(resource => {
                const selectedResource = resource === RESOURCE_WILD && selectedWilds.length ?
                    selectedWilds.shift() :
                    resource;
                units.push({
                    resource: selectedResource,
                    cardId: card.id,
                });
            });
        };
        const units = hand
            .filter(selected)
            .reduce((ret, card) => {
                addResourceUnits(card, card.resources, ret);

                return ret;
            }, []);

        generators.filter(selected).forEach(card => {
            card.abilities.forEach(ability => {
                if (!ability.isResource) {
                    return;
                }

                const resources = ability.resources || [ability.resource];
                addResourceUnits(card, resources, units);
            });
        });

        return units;
    }
    getAutomaticWilds(cards) {
        const {
            cost,
            requirement,
            resourceType,
        } = this.data;
        const resources = this.getPaymentResourceUnits(cards, true, []);
        const wilds = resources
            .filter(unit => unit.resource === RESOURCE_WILD)
            .map(() => RESOURCE_WILD);

        if (cost === COST_X && resourceType) {
            return wilds.map(() => resourceType);
        }

        const resourceCounts = new Map();
        resources.forEach(({resource}) => {
            if (resource !== RESOURCE_WILD) {
                resourceCounts.set(resource, (resourceCounts.get(resource) || 0) + 1);
            }
        });

        let wildIndex = 0;
        requirement.forEach(required => {
            if (required === RESOURCE_ANY || required === RESOURCE_WILD) {
                return;
            }

            const available = resourceCounts.get(required) || 0;
            if (available) {
                resourceCounts.set(required, available - 1);
            } else if (wildIndex < wilds.length) {
                wilds[wildIndex++] = required;
            }
        });

        return wilds;
    }
    getResourceMatches(resources, requirement) {
        const matchedResourceIndexes = Array(requirement.length).fill(-1);
        // Match resource icons to distinct requirements, including wild resources.
        const canPay = (resource, required) =>
            required === RESOURCE_ANY ||
            resource === RESOURCE_ANY ||
            resource === RESOURCE_WILD ||
            resource === required;
        const assignResource = (resourceIndex, visitedRequirements) => {
            for (let index = 0; index < requirement.length; index++) {
                if (visitedRequirements.has(index) ||
                    !canPay(resources[resourceIndex].resource, requirement[index])) {
                    continue;
                }

                visitedRequirements.add(index);
                const matchedResourceIndex = matchedResourceIndexes[index];
                if (matchedResourceIndex === -1 ||
                    assignResource(matchedResourceIndex, visitedRequirements)) {
                    matchedResourceIndexes[index] = resourceIndex;

                    return true;
                }
            }

            return false;
        };

        let count = 0;
        resources.forEach((_resource, index) => {
            if (assignResource(index, new Set())) {
                count++;
            }
        });

        const cardIds = new Set(matchedResourceIndexes
            .filter(index => index > -1)
            .map(index => resources[index].cardId));

        return {count, cardIds};
    }
    getPartialPaymentStatus() {
        const {data: {cards, requirement}} = this;
        const selectedCards = [...cards.hand, ...cards.generators]
            .filter(card => card.selected);
        const availableMatches = this.getResourceMatches(
            this.getPaymentResourceUnits(cards),
            requirement
        );
        const selectedMatches = this.getResourceMatches(
            this.getPaymentResourceUnits(cards, true),
            requirement
        );
        const hasUnusedCard = selectedCards.some(card =>
            !selectedMatches.cardIds.has(card.id));

        return {
            availableCount: availableMatches.count,
            canContinue: availableMatches.count > 0 &&
                selectedMatches.count === availableMatches.count &&
                !hasUnusedCard,
            hasUnusedCard,
            selectedCount: selectedMatches.count,
        };
    }
    isValidPartialPayment() {
        return this.getPartialPaymentStatus().canContinue;
    }
    isFullyPaid() {
        const {data: {cards, requirement}} = this;

        return this.getResourceMatches(
            this.getPaymentResourceUnits(cards, true),
            requirement
        ).count === requirement.length;
    }
    getValidationError() {
        const {allowPartial, cost} = this.data;

        if (allowPartial && cost !== COST_X) {
            const {
                availableCount,
                hasUnusedCard,
                selectedCount,
            } = this.getPartialPaymentStatus();

            if (!availableCount) {
                return 'No hay recursos disponibles que cubran estos requisitos.';
            }
            if (selectedCount < availableCount) {
                return 'La selección cubre menos requisitos de los posibles; cambia la asignación de comodines o selecciona otros recursos.';
            }
            if (hasUnusedCard) {
                return 'Retira los recursos seleccionados que no contribuyen al pago.';
            }

            return 'La combinación seleccionada no cubre los requisitos.';
        }

        if (cost === COST_X) {
            return 'Selecciona al menos un recurso para continuar.';
        }

        return 'Los recursos seleccionados no cubren todos los requisitos; revisa la asignación de comodines.';
    }
    handleOk() {
        if (!this.validate()) {
            this.showValidationError = true;

            return;
        }

        this.showValidationError = false;
        super.handleOk();
    }
    renderTitle() {
        const {data: {card}, hand} = this;

        return html`
            <h2 class="title" slot="headline">
                <span class="paying-card-title">
                    ${card && card.image ? html`
                        <mc-card-image
                            src="${CARD_PATH}${card.image}"
                            size="xs"
                            .horizontal="${isPlanCard(card)}"
                            aria-hidden="true"
                        ></mc-card-image>
                    ` : ''}
                    <span>${this.getTitle()}</span>
                </span>
                ${hand && hand.length ? this.renderButtonHand() : ''}
            </h2>
        `;
    }
    sendResponse() {
        this._response = {
            ...this._response,
            resources: this.resourcesConverted,
            fullyPaid: this.isFullyPaid(),
        };

        super.sendResponse();
    }
    validate() {
        const {data: {allowPartial, cost, requirement}} = this;

        if (allowPartial && cost !== COST_X) {
            return this.isValidPartialPayment();
        }

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
                    const anyIndex = _requirement.indexOf(RESOURCE_ANY);
                    const requirementIndex = index > -1 ? index : anyIndex;

                    if (requirementIndex > -1) {
                        _requirement.splice(requirementIndex, 1);
                    }
                });

                return !_requirement.length;
            }
        }


        return false;
    }
    _handleChangeWildResource(e) {
        const {wilds} = e.detail;

        this.showValidationError = false;
        this.data = {
            ...this.data,
            wilds
        };
    }
    _handlePaySelect(e) {
        const {card, type} = e.detail;
        const {data: {cards}} = this;

        this.showValidationError = false;
        card.selected = !card.selected;

        const updatedCards = {
            ...cards,
            [type]: cards[type].slice(),
        };
        this.data = {
            ...this.data,
            cards: updatedCards,
            wilds: this.getAutomaticWilds(updatedCards),
        };

        this._response = {
            paid: {
                ...this._response.paid,
                [type]: cards[type].filter(_card => _card.selected)
            },
        };
    }
    renderContent() {
        const {
            cost,
            data: {allowPartial, cards, requirement, resourceType},
            _response: {paid},
        } = this;
        const isPaid = this.validate();
        const validationError = this.showValidationError ?
            this.getValidationError() :
            '';

        return html`
            <mc-pay-cost
                cost="${cost}"
                resourceType="${resourceType}"
                .requirement="${requirement}"
                .wilds="${this.data.wilds}"
                .cards="${cards}"
                .paid="${paid}"
                .allowPartial="${allowPartial}"
                .validationError="${validationError}"
                .isPaid="${isPaid}"
                @pay-cost-select="${this._handlePaySelect.bind(this)}"
                @change-wild-resource="${this._handleChangeWildResource.bind(this)}"
            ></mc-pay-cost>
        `;
    }
}

window.customElements.define(McPayCostDialog.is, McPayCostDialog);
