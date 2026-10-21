import {html} from 'lit-element';
import {
    RESOURCE_ANY,
    RESOURCE_PAYMENT_MODE_DISCARD,
    RESOURCE_PAYMENT_MODE_PAYMENT,
} from 'mc-shared';

import stylesDialog from '../mc-dialog/mc-dialog.css.js';
import styles from './mc-pay-cost-dialog.css.js';
import '../../panels/mc-pay-cost/mc-pay-cost.js';
import '../../cards/mc-card-image/mc-card-image.js';
import {McDialog} from '../mc-dialog/mc-dialog.js';
import {BACK_CARD_PLAYER, getCardAssetUrl} from '../../../misc/cards.js';
import {RESOURCE_WILD} from '../../../misc/resources.js';
import {isPlanCard} from '../../../misc/utils.js';
import {
    getAutomaticWilds,
    getPaymentResourceUnits,
    getResourceMatches,
    getResourceUnitKey,
    getResourceUnitKeysForCard,
    normalizeResourceRequirements,
} from '../../../utils/resource-payment.js';

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
        this._selectedResourceKeys = undefined;
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
                allowWildConversion: true,
                differentTypes: false,
                resourcePaymentMode: RESOURCE_PAYMENT_MODE_PAYMENT,
                resourceSelectionMode: false,
                resourceType: undefined,
                requirement: [],
                resourcePreferences: [],
                exclusiveResourcePreferences: [],
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
    initProperties() {
        this._selectedResourceKeys = undefined;
        super.initProperties();
    }
    get resources() {
        const {_response: {paid}} = this;

        if (!paid) {
            return [];
        }

        return this.getPaymentResourceUnits(paid, true)
            .map(unit => unit.originalResource);
    }
    get allowsResourceSelection() {
        return this.data.resourceSelectionMode ||
            this.data.cost === COST_X ||
            this.data.resourcePaymentMode === RESOURCE_PAYMENT_MODE_DISCARD;
    }
    get allowsWildConversion() {
        return this.data.allowWildConversion !== false &&
            this.data.resourcePaymentMode !== RESOURCE_PAYMENT_MODE_DISCARD;
    }
    get resourcesConverted() {
        const {resources, data: {wilds}} = this;
        if (!this.allowsWildConversion) {
            return resources;
        }

        const _resources = [];
        const _wilds = wilds ? wilds.slice() : [];

        resources.forEach(resource => {
            if (resource === RESOURCE_WILD && _wilds.length) {
                _resources.push(_wilds.shift());
            } else {
                _resources.push(resource);
            }
        });

        return _resources;
    }
    get resourcesType() {
        const {data: {resourceType}} = this;
        const resources = this.resourcesConverted;

        if (resourceType && resourceType !== RESOURCE_ANY) {
            return resources.filter(resource => resource === resourceType);
        }

        return resources;
    }
    getTitle() {
        const {
            allowPartial,
            card,
            resourcePaymentMode,
        } = this.data;
        if (resourcePaymentMode === RESOURCE_PAYMENT_MODE_DISCARD) {
            return this.title || 'Descarta iconos de recursos de tu mano';
        }

        const action = allowPartial ?
            'Pagar los recursos posibles de' :
            'Pagar el coste de';

        return card && card.name ?
            `${action} ${card.name}` :
            allowPartial ? 'Pagar los recursos posibles' : 'Pagar el coste';
    }
    getResourceUnitKey({source, cardId, resourceIndex}) {
        return getResourceUnitKey({source, cardId, resourceIndex});
    }
    getResourceUnitKeysForCard(card, source) {
        return getResourceUnitKeysForCard(card, source);
    }
    getPaymentResourceUnits(
        cards,
        selectedOnly = false,
        selectedWilds = selectedOnly ? (this.data.wilds || []).slice() : []
    ) {
        return getPaymentResourceUnits(cards, {
            selectedOnly,
            selectedWilds,
            allowWildConversion: this.allowsWildConversion,
            selectedResourceKeys: selectedOnly &&
                this.allowsResourceSelection ?
                this._selectedResourceKeys :
                undefined,
        });
    }
    getAutomaticWilds(cards) {
        const {
            requirement,
            resourceType,
            resourcePreferences,
            exclusiveResourcePreferences,
        } = this.data;
        const resources = this.getPaymentResourceUnits(cards, true, []);

        if (resourceType && resourceType !== RESOURCE_ANY) {
            return resources
                .filter(unit => unit.originalResource === RESOURCE_WILD)
                .map(() => resourceType);
        }

        return getAutomaticWilds(
            {
                requirement,
                resourcePreferences,
                exclusiveResourcePreferences,
            },
            resources,
            {allowWildConversion: this.allowsWildConversion}
        );
    }
    getResourceMatches(resources, requirement) {
        return getResourceMatches(
            resources,
            requirement,
            {allowWildConversion: this.allowsWildConversion}
        );
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
        const {data: {cards, cost, requirement}} = this;

        if (cost === COST_X) {
            return this.resourcesType.length > 0;
        }

        return this.getResourceMatches(
            this.getPaymentResourceUnits(cards, true),
            requirement
        ).count >= normalizeResourceRequirements(requirement).length;
    }
    getValidationError() {
        const {
            allowPartial,
            cost,
            differentTypes,
            requirement,
            resourcePaymentMode,
        } = this.data;
        const requirements = normalizeResourceRequirements(requirement);

        if (resourcePaymentMode === RESOURCE_PAYMENT_MODE_DISCARD) {
            return 'Los iconos seleccionados no cubren los requisitos de recursos impresos.';
        }

        if (differentTypes &&
            new Set(this.resourcesType).size < requirements.length) {
            return 'Selecciona recursos de tipos distintos.';
        }

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
                    ${card && (card.isFacedownCard || card.image) ? html`
                        <mc-card-image
                            src="${card.isFacedownCard ?
                                getCardAssetUrl(BACK_CARD_PLAYER) :
                                getCardAssetUrl(card.image)}"
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
        const {cost, resourceType} = this.data;
        this._response = {
            ...this._response,
            resources: cost !== COST_X &&
                resourceType &&
                resourceType !== RESOURCE_ANY ?
                this.resourcesType :
                this.resourcesConverted,
            resourceUnits: this.getPaymentResourceUnits(
                this._response.paid,
                true
            ),
            fullyPaid: this.isFullyPaid(),
        };

        super.sendResponse();
    }
    validate() {
        const {
            allowPartial,
            cost,
            requirement,
            differentTypes,
            resourcePaymentMode,
        } = this.data;
        const requirements = normalizeResourceRequirements(requirement);

        if (allowPartial && cost !== COST_X) {
            return this.isValidPartialPayment();
        }

        const resources = this.resourcesType;
        if (differentTypes && new Set(resources).size < requirements.length) {
            return false;
        }
        if (cost === COST_X) {
            if (resources.length > 0) {
                return true;
            }
        } else if (this.getResourceMatches(
            this.getPaymentResourceUnits(this._response.paid, true),
            requirement
        ).count >= requirements.length) {
            return resourcePaymentMode === RESOURCE_PAYMENT_MODE_DISCARD ||
                resources.length >= parseInt(cost);
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
        if (Array.isArray(this._selectedResourceKeys)) {
            const selectedKeys = new Set(this._selectedResourceKeys);
            const source = type === 'hand' ? 'hand' : 'generators';

            this.getResourceUnitKeysForCard(card, source).forEach(key => {
                if (card.selected) {
                    selectedKeys.add(key);
                } else {
                    selectedKeys.delete(key);
                }
            });
            this._selectedResourceKeys = [...selectedKeys];
        }

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
    _handleResourceUnitToggle(e) {
        const {key} = e.detail;
        const selectedKeys = new Set(this._selectedResourceKeys ||
            this.getPaymentResourceUnits(this._response.paid, true, [])
                .map(unit => this.getResourceUnitKey(unit)));

        if (selectedKeys.has(key)) {
            selectedKeys.delete(key);
        } else {
            selectedKeys.add(key);
        }

        this.showValidationError = false;
        this._selectedResourceKeys = [...selectedKeys];
        this.data = {
            ...this.data,
            wilds: this.getAutomaticWilds(this.data.cards),
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
                .allowWildConversion="${this.allowsWildConversion}"
                .resourcePaymentMode="${this.data.resourcePaymentMode}"
                .resourceSelectionMode="${this.allowsResourceSelection}"
                .selectedResources="${this._selectedResourceKeys}"
                .cards="${cards}"
                .paid="${paid}"
                .allowPartial="${allowPartial}"
                .validationError="${validationError}"
                .isPaid="${isPaid}"
                @pay-cost-select="${this._handlePaySelect.bind(this)}"
                @resource-unit-toggle="${this._handleResourceUnitToggle.bind(this)}"
                @change-wild-resource="${this._handleChangeWildResource.bind(this)}"
            ></mc-pay-cost>
        `;
    }
}

window.customElements.define(McPayCostDialog.is, McPayCostDialog);
