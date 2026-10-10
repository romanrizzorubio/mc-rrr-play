import {LitElement, html} from 'lit-element';

import styles from './mc-deck-hero-selector.css.js';
import {dispatchComponentEvent} from '../../utils/dispatch-component-event.js';
import {getCardImageUrl} from '../../utils/deck-presentation.js';

export class McDeckHeroSelector extends LitElement {
    static get is() {
        return 'mc-deck-hero-selector';
    }
    static get properties() {
        return {
            heroes: {type: Array},
            heroId: {type: String},
            disabled: {type: Boolean},
        };
    }
    static get styles() {
        return [styles];
    }
    constructor() {
        super();

        this.heroes = [];
        this.heroId = '';
        this.disabled = false;
    }
    get sortedHeroes() {
        return [...this.heroes].sort((left, right) =>
            left.name.localeCompare(right.name, 'es', {sensitivity: 'base'}) ||
            left.id.localeCompare(right.id));
    }
    handleSelect(hero) {
        dispatchComponentEvent(this, 'hero-selected', {heroId: hero.id});
    }
    renderHero(hero) {
        const imageUrl = getCardImageUrl(hero);
        const className = hero.id === this.heroId ? 'hero-option selected' : 'hero-option';

        return html`
            <md-elevated-button
                class="${className}"
                type="button"
                ?disabled="${this.disabled}"
                @click="${() => this.handleSelect(hero)}"
            >
                <span class="hero-choice">
                    ${imageUrl ? html`<img class="hero-image" src="${imageUrl}" alt="">` : ''}
                    <span class="hero-name">${hero.name}</span>
                </span>
            </md-elevated-button>
        `;
    }
    render() {
        return html`
            <div class="hero-grid">
                ${this.sortedHeroes.map(hero => this.renderHero(hero))}
            </div>
        `;
    }
}

if (!window.customElements.get(McDeckHeroSelector.is)) {
    window.customElements.define(McDeckHeroSelector.is, McDeckHeroSelector);
}
