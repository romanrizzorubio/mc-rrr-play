import {LitElement, html} from 'lit-element';

import styles from './mc-superhero-card.css.js';
import '../../mc-card/mc-card.js';
import {ABILITY_ID} from '../../../../misc/utils.js';
import {EVENTS} from 'mc-endpoints';

export const MENU_OPTION_END = EVENTS.TURN.END;
export const MENU_OPTION_FLIP = 'flip';

export class SuperheroCardComponent extends LitElement {
    static get is() {
        return 'mc-superhero-card';
    }
    static get styles() {
        return styles;
    }

    static get properties() {
        return {
            name: {type: String},
            image: {type: String},
            life: {type: Number},
            hitPoints: {type: Number},
            handSize: {type: Number},
            canEndTurn: {type: Boolean},
            attack: {type: Number},
            thwart: {type: Number},
            defense: {type: Number},
            recovery: {type: Number},
            flipped: {type: Boolean},
            exhausted: {type: Boolean},
            abilities: {type: Array},
            extraTraits: {type: Array},
            extraKeywords: {type: Array},
        };
    }

    constructor() {
        super();

        this.name = '';
        this.image = '';
        this.life = 0;
        this.hitPoints = undefined;
        this.handSize = 0;
        this.canEndTurn = false;
        this.attack = undefined;
        this.thwart = undefined;
        this.defense = undefined;
        this.recovery = undefined;
        this.flipped = false;
        this.exhausted = false;
        this.abilities = [];
        this.extraTraits = [];
        this.extraKeywords = [];
    }

    get menuOptions() {
        const options = this.abilities
            .filter(ability => ability.isAction || ability.isBasic)
            .map(ability => ({
                id: `${ABILITY_ID}${ability.index}`,
                text: ability.name,
                disable: ability.disable,
            }));

        options.unshift({
            id: MENU_OPTION_FLIP,
            text: 'Cambiar de identidad',
            disable: this.flipped
        });

        if (this.canEndTurn) {
            options.unshift({
                id: MENU_OPTION_END,
                text: 'Finalizar turno',
            });
        }

        return options;
    }

    handleClickMenu(e) {
        const {option} = e.detail;

        if (option === MENU_OPTION_END) {
            this.dispatchEvent(new CustomEvent('player-end', {
                bubbles: true,
                composed: true,
            }));
        } else if (option === MENU_OPTION_FLIP) {
            this.dispatchEvent(new CustomEvent('superhero-flip', {
                bubbles: true,
                composed: true,
            }));
        } else {
            const index = option.substring(ABILITY_ID.length, option.length);
            this.dispatchEvent(new CustomEvent('superhero-ability', {
                bubbles: true,
                composed: true,
                detail: {
                    ability: parseInt(index),
                }
            }));
        }
    }

    render() {
        const {
            image,
            life,
            hitPoints,
            handSize,
            attack,
            thwart,
            defense,
            recovery,
            exhausted,
            statusCards,
            extraTraits,
            extraKeywords,
        } = this;

        return html`
            <div class="panel">
                <mc-card
                    image="${image}"
                    .life="${life}"
                    .hitPoints="${hitPoints}"
                    .statusCards="${statusCards}"
                    .exhausted="${exhausted}"
                    .menuOptions="${this.menuOptions}"
                    .extraTraits="${extraTraits}"
                    .extraKeywords="${extraKeywords}"
                    show-acquired-traits
                    show-basic-stats
                    .handSize="${handSize}"
                    .attack="${attack}"
                    .thwart="${thwart}"
                    .defense="${defense}"
                    .recovery="${recovery}"
                    @card-menu-click="${this.handleClickMenu}"
                ></mc-card>
            </div>
        `;
    }
}

window.customElements.define(SuperheroCardComponent.is, SuperheroCardComponent);
