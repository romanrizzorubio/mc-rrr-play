import {LitElement, html} from 'lit-element';

import {DECK_ROUTE_NAMES} from '../../../utils/app-routes.js';
import styles from './mc-primary-navigation.css.js';

export class McPrimaryNavigation extends LitElement {
    static get is() {
        return 'mc-primary-navigation';
    }
    static get properties() {
        return {
            activeRoute: {type: String, attribute: 'active-route'},
        };
    }
    static get styles() {
        return [styles];
    }
    constructor() {
        super();

        this.activeRoute = '';
    }
    get activeTabIndex() {
        return DECK_ROUTE_NAMES.has(this.activeRoute) ? 1 : 0;
    }
    handleChange(event) {
        const route = event.target.activeTabIndex === 1 ? 'decks' : 'matches';

        this.dispatchEvent(new CustomEvent('navigate-route', {
            detail: {route},
            bubbles: true,
            composed: true,
        }));
    }
    render() {
        return html`
            <nav aria-label="Navegación principal">
                <md-tabs
                    .activeTabIndex="${this.activeTabIndex}"
                    @change="${this.handleChange.bind(this)}"
                >
                    <md-secondary-tab>Partidas</md-secondary-tab>
                    <md-secondary-tab>Mazos</md-secondary-tab>
                </md-tabs>
            </nav>
        `;
    }
}

if (!window.customElements.get(McPrimaryNavigation.is)) {
    window.customElements.define(McPrimaryNavigation.is, McPrimaryNavigation);
}
