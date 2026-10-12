import {LitElement, html} from 'lit-element';

import styles from './mc-card-list.css.js';
import '../mc-card/mc-card.js';
import {ABILITY_ID, isPlanCard} from '../../../misc/utils.js';
import {MENU_OPTION_VIEW_TUCKED_CARDS} from '../../../misc/card-menu.js';

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
            disabledCards: {type: Array},
            showBasicStats: {type: Boolean, attribute: 'show-basic-stats'},
            showAcquiredTraits: {type: Boolean, attribute: 'show-acquired-traits'},
            showMenuAbilities: {type: Boolean, attribute: 'show-menu-abilities'},
            showLife: {type: Boolean, attribute: 'show-life'},
            showDamage: {type: Boolean, attribute: 'show-damage'},
            showThreat: {type: Boolean, attribute: 'show-threat'},
            showGeneric: {type: Boolean, attribute: 'show-generic'},
            showExhausted: {type: Boolean, attribute: 'show-exhausted'},
            highlightPlayable: {type: Boolean, attribute: 'highlight-playable'},
            rotatePlanCards: {type: Boolean, attribute: 'rotate-plan-cards'},
        };
    }
    constructor() {
        super();

        this.size = 'm';
        this.cards = [];
        this.marked = [];
        this.disabledCards = [];
        this.showBasicStats = false;
        this.showAcquiredTraits = false;
        this.showMenuAbilities = false;
        this.showLife = false;
        this.showDamage = false;
        this.showThreat = false;
        this.showGeneric = false;
        this.showExhausted = false;
        this.highlightPlayable = false;
        this.rotatePlanCards = false;
    }
    getMenuOptions(card) {
        const tuckedCards = card.tuckedCards || [];
        const abilities = this.showMenuAbilities ?
            (card.abilities || []).reduce((ret, ability, index) => {
                if (ability.isAction || ability.isBasic) {
                    ret.push({
                        id: `${ABILITY_ID}${index}`,
                        text: ability.name,
                        disable: ability.disable,
                    });
                }

                return ret;
            }, []) :
            [];

        if (tuckedCards.length && abilities.length) {
            return [
                ...abilities,
                {
                    id: MENU_OPTION_VIEW_TUCKED_CARDS,
                    text: 'Ver cartas metidas debajo',
                },
            ];
        }

        if (this.showMenuAbilities) {
            if (abilities.length > 1) {
                return abilities;
            }
        }

        return [];
    }
    handleViewTuckedCards(index) {
        return e => {
            e.stopPropagation();

            const card = this.cards[index];

            this.dispatchEvent(new CustomEvent('view-tucked-cards', {
                bubbles: true,
                composed: true,
                detail: {
                    card,
                    cards: card.tuckedCards || [],
                },
            }));
        };
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
            if (this.disabledCards.includes(index)) {
                return;
            }

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
            disabledCards,
            showBasicStats,
            showAcquiredTraits,
            showLife,
            showDamage,
            showThreat,
            showGeneric,
            highlightPlayable,
            rotatePlanCards,
        } = this;
        const {
            attached,
            damage,
            faceDown,
            tuckedCards,
            isFacedownCard,
            image,
            name,
            hitPoints,
            attack,
            thwart,
            defense,
            recovery,
            scheme,
            unprintedStats = [],
            extraTraits = [],
            extraKeywords = [],
            statusCards,
        } = card;
        const horizontal = isPlanCard(card);
        const rotated = rotatePlanCards && horizontal;
        const {abilityNames = []} = card;

        const life = showLife && Number.isFinite(card.life) ?
            card.life :
            undefined;
        const threat = showThreat ? card.threat : undefined;
        const generic = showGeneric ? card.counters : undefined;
        const exhausted = this.showExhausted && card.exhausted;
        const classes = [];

        if (marked.some(i => i === index)) {
            classes.push('marked');
        }
        if (disabledCards.includes(index)) {
            classes.push('disabled');
        }
        if (
            highlightPlayable &&
            card.playable === true &&
            !disabledCards.includes(index)
        ) {
            classes.push('playable');
        }

        return html`
            <mc-card
                class="${classes.join(' ')}"
                name="${name}"
                image="${image}"
                .attack="${attack}"
                .thwart="${thwart}"
                .defense="${defense}"
                .recovery="${recovery}"
                .scheme="${scheme}"
                .unprintedStats="${unprintedStats}"
                .showBasicStats="${showBasicStats}"
                .extraTraits="${extraTraits}"
                .extraKeywords="${extraKeywords}"
                .showAcquiredTraits="${showAcquiredTraits}"
                .life="${life}"
                .hitPoints="${hitPoints}"
                .damage="${damage}"
                .showDamage="${showDamage}"
                threat="${threat}"
                .generic="${generic}"
                size="${size}"
                ?horizontal="${horizontal}"
                .rotated="${rotated}"
                hide-name
                .showThreat="${showThreat}"
                .showGeneric="${showGeneric}"
                .exhausted="${exhausted}"
                .attached="${attached}"
                .faceDown="${faceDown}"
                .tuckedCards="${tuckedCards}"
                .isFacedownCard="${isFacedownCard}"
                .statusCards="${statusCards}"
                .menuOptions="${this.getMenuOptions(card)}"
                @change-menu="${this.handleChangeMenu(index)}"
                @card-click="${this.handleClick(index)}"
                @view-tucked-cards="${this.handleViewTuckedCards(index)}"
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
