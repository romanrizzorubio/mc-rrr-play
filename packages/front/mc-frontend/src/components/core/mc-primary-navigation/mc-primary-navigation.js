import {LitElement, html} from 'lit-element';
import {live} from 'lit/directives/live.js';

import {
    ADMIN_REQUIRED_ROUTE_NAMES,
    DECK_ROUTE_NAMES,
} from '../../../utils/app-routes.js';
import styles from './mc-primary-navigation.css.js';

export class McPrimaryNavigation extends LitElement {
    static get is() {
        return 'mc-primary-navigation';
    }
    static get properties() {
        return {
            activeRoute: {type: String, attribute: 'active-route'},
            user: {type: Object},
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
        if (this.user?.isAdmin && ADMIN_REQUIRED_ROUTE_NAMES.has(this.activeRoute)) {
            return 2;
        }

        if (!this.user) {
            return DECK_ROUTE_NAMES.has(this.activeRoute) ? 0 : -1;
        }
        if (DECK_ROUTE_NAMES.has(this.activeRoute)) {
            return 1;
        }
        if (this.activeRoute === 'matches' || this.activeRoute === 'match-lobby' ||
            this.activeRoute === 'create-match') {
            return 0;
        }

        return -1;
    }
    handleTabClick(event, route) {
        event.preventDefault();
        this.handleTabNavigation(route);
    }
    handleTabNavigation(route) {
        if (!route || (!this.user && route !== 'decks') ||
            (route === 'users' && !this.user?.isAdmin)) {
            return;
        }

        this.dispatchEvent(new CustomEvent('navigate-route', {
            detail: {route},
            bubbles: true,
            composed: true,
        }));
    }
    handleUnselectedTabKeydown(event) {
        const tabs = Array.from(
            this.renderRoot.querySelectorAll('.unselected-tabs md-secondary-tab'),
        );
        const currentIndex = tabs.indexOf(event.target);
        if (currentIndex === -1) {
            return;
        }

        const focusIndexByKey = {
            ArrowLeft: (currentIndex - 1 + tabs.length) % tabs.length,
            ArrowRight: (currentIndex + 1) % tabs.length,
            Home: 0,
            End: tabs.length - 1,
        };
        const focusIndex = focusIndexByKey[event.key];
        if (focusIndex === undefined) {
            return;
        }

        event.preventDefault();
        tabs[focusIndex].focus();
    }
    render() {
        const tabs = html`
            ${this.user ? html`
                <md-secondary-tab
                    .active="${live(this.activeTabIndex === 0)}"
                    @click="${event => this.handleTabClick(event, 'matches')}"
                >Partidas</md-secondary-tab>
            ` : ''}
            <md-secondary-tab
                .active="${live(this.activeTabIndex === (this.user ? 1 : 0))}"
                @click="${event => this.handleTabClick(event, 'decks')}"
            >Mazos</md-secondary-tab>
            ${this.user?.isAdmin ? html`
                <md-secondary-tab
                    .active="${live(this.activeTabIndex === 2)}"
                    @click="${event => this.handleTabClick(event, 'users')}"
                >Usuarios</md-secondary-tab>
            ` : ''}
        `;

        return html`
            <nav aria-label="Navegación principal">
                ${this.activeTabIndex < 0 ? html`
                    <div
                        class="unselected-tabs"
                        role="tablist"
                        @keydown="${this.handleUnselectedTabKeydown.bind(this)}"
                    >${tabs}</div>
                ` : html`
                    <md-tabs
                        .activeTabIndex="${live(this.activeTabIndex)}"
                    >${tabs}</md-tabs>
                `}
            </nav>
        `;
    }
}

if (!window.customElements.get(McPrimaryNavigation.is)) {
    window.customElements.define(McPrimaryNavigation.is, McPrimaryNavigation);
}
