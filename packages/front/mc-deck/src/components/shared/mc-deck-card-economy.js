import {LitElement, html} from 'lit-element';
import {
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    RESOURCE_WILD,
} from 'mc-shared';

import styles from './mc-deck-card-economy.css.js';
import {getResourceName} from '../../utils/deck-presentation.js';
import {getPrintedResourceTypes} from '../../utils/deck-resources.js';

const resourceTypes = new Set([
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    RESOURCE_WILD,
]);

const renderResource = resource => resourceTypes.has(resource) ? html`
    <span class="mc-icon ${resource}" aria-hidden="true">${resource}</span>
` : html``;

export class McDeckCardEconomy extends LitElement {
    static get is() {
        return 'mc-deck-card-economy';
    }
    static get properties() {
        return {
            cost: {type: Number},
            resources: {type: Array},
            showCost: {type: Boolean},
        };
    }
    static get styles() {
        return [styles];
    }
    constructor() {
        super();

        this.cost = 0;
        this.resources = [];
        this.showCost = true;
    }
    render() {
        const resources = getPrintedResourceTypes(this.resources);
        const resourceLabel = resources.length ?
            `Recursos: ${resources.map(getResourceName).join(', ')}.` :
            'Sin recursos.';

        return html`
            <div class="economy">
                ${this.showCost ? html`
                    <span class="cost">
                        <span class="label">Coste</span>
                        <strong>${this.cost ?? 0}</strong>
                    </span>
                    <span class="separator" aria-hidden="true">·</span>
                ` : ''}
                <span class="resource-summary">
                    <span class="label">Recursos</span>
                    <span class="resource-icons" role="img" aria-label="${resourceLabel}">
                        ${resources.length ?
                            resources.map(renderResource) :
                            html`<span aria-hidden="true">—</span>`
                        }
                    </span>
                </span>
            </div>
        `;
    }
}

if (!window.customElements.get(McDeckCardEconomy.is)) {
    window.customElements.define(McDeckCardEconomy.is, McDeckCardEconomy);
}
