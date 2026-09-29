import {LitElement, html} from 'lit-element';
import styles from './mc-superhero-card.css.js';

import "../../mc-card/mc-card.js";
import {ABILITY_ID} from "../../../../misc/utils.js";

export const MENU_OPTION_END = 'end-turn';
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
            flipped: {type: Boolean},
            exhausted: {type: Boolean},
            abilities: {type: Array},
        };
    }

    constructor() {
        super();

        this.name = '';
        this.image = '';
        this.life = 0;
        this.flipped = false;
        this.exhausted = false;
        this.abilities = []
    }

    get menuOptions() {
        const options = this.abilities
            .filter(ability => ability.isAction || ability.isBasic)
            .map(ability => ({
                id: `${ABILITY_ID}${ability.index}`,
                text: ability.name,
            }));

        options.unshift({
            id: MENU_OPTION_FLIP,
            text: 'Cambiar de identidad',
            disable: this.flipped
        });

        options.unshift({
            id: MENU_OPTION_END,
            text: 'Finalizar turno',
        });

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
        const {image, life, exhausted, statusCards} = this;

        return html`
            <span class="panel">
                <div>
                    <mc-card
                        image="${image}"
                        show-counters
                        damage="${life}"
                        show-damage
                        .statusCards="${statusCards}"
                        .exhausted="${exhausted}"
                        .menuOptions="${this.menuOptions}"
                        @card-menu-click="${this.handleClickMenu}"
                    ></mc-card>
                </div>
            </span>
        `;
    }
}

window.customElements.define(SuperheroCardComponent.is, SuperheroCardComponent);
