import {LitElement, html} from 'lit-element';

import styles from './mc-card-list.css.js';
import '../mc-card/mc-card.js';
import {ABILITY_ID} from '../../../misc/utils.js';

export class HandComponent extends LitElement {
    static get is() {
        return 'mc-card-list';
    }
    static get styles() {
        return styles;
    }
    static get properties() {
        return {
            size: {type: String},
            cards: {type: Array},
            marked: {type: Array},
            showMenuAbilities: {type: Boolean, attribute: 'show-menu-abilities'},
            showDamage: {type: Boolean, attribute: 'show-damage'},
            showDamageIfHas: {type: Boolean, attribute: 'show-damage-if-has'},
            showThreat: {type: Boolean, attribute: 'show-threat'},
            showGeneric: {type: Boolean, attribute: 'show-generic'},
            showExhausted: {type: Boolean, attribute: 'show-exhausted'},
        };
    }
    constructor() {
        super();

        this.size = 'm';
        this.cards = [];
        this.marked = [];
        this.showMenuAbilities = false;
        this.showDamage = false;
        this.showDamageIfHas = false;
        this.showThreat = false;
        this.showGeneric = false;
        this.showExhausted = false;
    }
    getMenuOptions(card) {
        if (this.showMenuAbilities) {
            const options = card.abilities
                .filter(ability => ability.isAction ||
                    ability.isBasic)
                .map((ability, index) => ({
                    id: `${ABILITY_ID}${index}`,
                    text: ability.name
                }));

            if (options.length > 1) {
                return options;
            }
        }

        return [];
    }
    handleChangeMenu(index) {
        const {cards} = this;

        return e => {
            e.stopPropagation();

            this.dispatchEvent(new CustomEvent('change-menu', {
                bubbles: true,
                composed: true,
                detail: {
                    ...e.detail,
                    card: cards[index],
                    cardIndex: index,
                },
            }));
        };
    }
    handleClick(index) {
        return () => {
            const {cards} = this;

            this.dispatchEvent(new CustomEvent('card-list-select', {
                bubbles: true,
                composed: true,
                detail: {
                    card: cards[index],
                    cardIndex: index,
                },
            }));
        };
    }
    handleMenuClick(index) {
        return e => {
            e.stopPropagation();

            const {option} = e.detail;
            const {cards} = this;

            const abilityIndex = option.substring(ABILITY_ID.length, option.length);
            this.dispatchEvent(new CustomEvent('card-list-menu-click', {
                bubbles: true,
                composed: true,
                detail: {
                    ability: parseInt(abilityIndex),
                    card: cards[index],
                    cardIndex: index,
                }
            }));
        };
    }
    renderCard(card, index) {
        const {
            size,
            marked,
            showDamage,
            showDamageIfHas,
            showThreat,
            showGeneric,
        } = this;
        const {
            attached,
            faceDown,
            image,
            name,
            statusCards,
        } = card;
        const {abilityNames = []} = card;

        const damage = showDamage || showDamageIfHas ?
            card.life !== undefined ?
                card.life :
                card.damage !== 0 ?
                    card.damage :
                    undefined :
            undefined;
        const threat = showThreat ? card.threat : undefined;
        const generic = showGeneric ? card.counters : undefined;
        const exhausted = this.showExhausted && card.exhausted;

        return html`
            <mc-card
                class="${marked.some(i => i === index) ? 'marked' : ''}"
                name="${name}"
                image="${image}"
                damage="${damage}"
                threat="${threat}"
                generic="${generic}"
                size="${size}"
                hide-name
                .showDamage="${showDamage}"
                .showDamageIfHas="${showDamageIfHas}"
                .showThreat="${showThreat}"
                .showGeneric="${showGeneric}"
                .exhausted="${exhausted}"
                .attached="${attached}"
                .faceDown="${faceDown}"
                .statusCards="${statusCards}"
                .menuOptions="${this.getMenuOptions(card)}"
                @change-menu="${this.handleChangeMenu(index)}"
                @card-click="${this.handleClick(index)}"
                @card-menu-click="${this.handleMenuClick(index)}"
            >${abilityNames.map(abilityName => html`
                <div slot="top" class="ability-name">${abilityName}</div>
            `)}</mc-card>
        `;
    }
    render() {
        const {cards} = this;

        return cards.map(this.renderCard.bind(this));
    }
}

window.customElements.define(HandComponent.is, HandComponent);
