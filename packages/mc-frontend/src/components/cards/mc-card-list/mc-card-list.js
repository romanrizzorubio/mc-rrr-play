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
            showBasicStats: {type: Boolean, attribute: 'show-basic-stats'},
            showAcquiredTraits: {type: Boolean, attribute: 'show-acquired-traits'},
            showMenuAbilities: {type: Boolean, attribute: 'show-menu-abilities'},
            showDamage: {type: Boolean, attribute: 'show-damage'},
            showDamageIfHas: {type: Boolean, attribute: 'show-damage-if-has'},
            showThreat: {type: Boolean, attribute: 'show-threat'},
            showGeneric: {type: Boolean, attribute: 'show-generic'},
            showExhausted: {type: Boolean, attribute: 'show-exhausted'},
            dimUnplayable: {type: Boolean, attribute: 'dim-unplayable'},
        };
    }
    constructor() {
        super();

        this.size = 'm';
        this.cards = [];
        this.marked = [];
        this.showBasicStats = false;
        this.showAcquiredTraits = false;
        this.showMenuAbilities = false;
        this.showDamage = false;
        this.showDamageIfHas = false;
        this.showThreat = false;
        this.showGeneric = false;
        this.showExhausted = false;
        this.dimUnplayable = false;
    }
    getMenuOptions(card) {
        if (this.showMenuAbilities) {
            const options = card.abilities.reduce((ret, ability, index) => {
                if (ability.isAction || ability.isBasic) {
                    ret.push({
                        id: `${ABILITY_ID}${index}`,
                        text: ability.name,
                        disable: ability.disable,
                    });
                }

                return ret;
            }, []);

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
            showBasicStats,
            showAcquiredTraits,
            showDamage,
            showDamageIfHas,
            showThreat,
            showGeneric,
            dimUnplayable,
        } = this;
        const {
            attached,
            faceDown,
            image,
            name,
            hitPoints,
            attack,
            thwart,
            defense,
            recovery,
            scheme,
            extraTraits = [],
            statusCards,
        } = card;
        const {abilityNames = []} = card;

        const showHealth = showDamage || showDamageIfHas;
        const life = showHealth && Number.isFinite(card.life) ?
            card.life :
            undefined;
        const damage = showHealth && life === undefined && card.damage !== 0 ?
            card.damage :
            undefined;
        const threat = showThreat ? card.threat : undefined;
        const generic = showGeneric ? card.counters : undefined;
        const exhausted = this.showExhausted && card.exhausted;
        const classes = [];

        if (marked.some(i => i === index)) {
            classes.push('marked');
        }
        if (dimUnplayable && card.playable === false) {
            classes.push('unplayable');
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
                .showBasicStats="${showBasicStats}"
                .extraTraits="${extraTraits}"
                .showAcquiredTraits="${showAcquiredTraits}"
                damage="${damage}"
                .life="${life}"
                .hitPoints="${hitPoints}"
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
