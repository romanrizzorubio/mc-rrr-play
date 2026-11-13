import {LitElement, html} from 'lit-element';

import styles from './mc-superhero-card.css.js';
import '../../mc-card/mc-card.js';
import '../../mc-card-list/mc-card-list.js';
import {ABILITY_ID} from '../../../../misc/utils.js';
import {MENU_OPTION_VIEW_TUCKED_CARDS} from '../../../../misc/card-menu.js';
import {EVENTS} from 'mc-endpoints';

export const MENU_OPTION_END = EVENTS.TURN.END;
export const MENU_OPTION_FLIP = 'flip';
export const MENU_OPTION_REQUEST_PLAYER_ACTION = 'request-player-action';
export const MENU_OPTION_VIEW_HAND = 'view-player-hand';

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
            firstPlayerTokenUrl: {type: String},
            card: {type: Object},
            activationActor: {type: Object},
            dragActivation: {type: Object},
            dragPlayCard: {type: Object},
            dragResourcePayment: {type: Object},
            life: {type: Number},
            hitPoints: {type: Number},
            handSize: {type: Number},
            canEndTurn: {type: Boolean},
            canFlip: {type: Boolean},
            attack: {type: Number},
            thwart: {type: Number},
            defense: {type: Number},
            recovery: {type: Number},
            flipped: {type: Boolean},
            exhausted: {type: Boolean},
            attached: {type: Array},
            tuckedCards: {type: Array},
            abilities: {type: Array},
            extraMenuOptions: {type: Array},
            extraTraits: {type: Array},
            extraKeywords: {type: Array},
            aspectMarkers: {type: Array},
        };
    }

    constructor() {
        super();

        this.name = '';
        this.image = '';
        this.firstPlayerTokenUrl = '';
        this.card = null;
        this.activationActor = null;
        this.dragActivation = null;
        this.dragPlayCard = null;
        this.dragResourcePayment = null;
        this.life = 0;
        this.hitPoints = undefined;
        this.handSize = 0;
        this.canEndTurn = false;
        this.canFlip = false;
        this.attack = undefined;
        this.thwart = undefined;
        this.defense = undefined;
        this.recovery = undefined;
        this.flipped = false;
        this.exhausted = false;
        this.attached = [];
        this.tuckedCards = [];
        this.abilities = [];
        this.extraMenuOptions = [];
        this.extraTraits = [];
        this.extraKeywords = [];
        this.aspectMarkers = [];
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
            disable: this.flipped || !this.canFlip
        });

        if (this.canEndTurn) {
            options.unshift({
                id: MENU_OPTION_END,
                text: 'Finalizar turno',
            });
        }

        options.push(...(this.extraMenuOptions || []));

        if (this.tuckedCards?.length) {
            options.push({
                id: MENU_OPTION_VIEW_TUCKED_CARDS,
                text: 'Ver cartas metidas debajo',
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
        } else if (option === MENU_OPTION_VIEW_TUCKED_CARDS) {
            this.dispatchEvent(new CustomEvent('view-tucked-cards', {
                bubbles: true,
                composed: true,
                detail: {
                    card: {
                        name: this.name,
                        image: this.image,
                    },
                    cards: this.tuckedCards,
                },
            }));
        } else if (option === MENU_OPTION_REQUEST_PLAYER_ACTION ||
            option === MENU_OPTION_VIEW_HAND) {
            this.dispatchEvent(new CustomEvent('change-menu', {
                bubbles: true,
                composed: true,
                detail: {
                    card: this.card,
                    menuOptions: this.menuOptions,
                },
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
            card,
            firstPlayerTokenUrl,
            life,
            activationActor,
            hitPoints,
            handSize,
            attack,
            thwart,
            defense,
            recovery,
            exhausted,
            statusCards,
            attached,
            tuckedCards,
            extraTraits,
            extraKeywords,
        } = this;

        return html`
            <div class="panel">
                <mc-card
                    image="${image}"
                    .card="${card}"
                    .activationActor="${activationActor}"
                    .dragActivation="${this.dragActivation}"
                    .dragPlayCard="${this.dragPlayCard}"
                    .dragResourcePayment="${this.dragResourcePayment}"
                    .life="${life}"
                    .hitPoints="${hitPoints}"
                    .generic="${card?.counters}"
                    .showGeneric="${Boolean(card?.counters)}"
                    .statusCards="${statusCards}"
                    .exhausted="${exhausted}"
                    .attached="${attached}"
                    .tuckedCards="${tuckedCards}"
                    .menuOptions="${this.menuOptions}"
                    .doubleClickOption="${this.canEndTurn ? MENU_OPTION_END : ''}"
                    .extraTraits="${extraTraits}"
                    .extraKeywords="${extraKeywords}"
                    .aspectMarkers="${this.aspectMarkers}"
                    show-acquired-traits
                    show-basic-stats
                    .handSize="${handSize}"
                    .attack="${attack}"
                    .thwart="${thwart}"
                    .defense="${defense}"
                    .recovery="${recovery}"
                    @card-menu-click="${this.handleClickMenu}"
                >
                    ${firstPlayerTokenUrl ? html`
                        <img
                            class="first-player-token"
                            slot="image-marker"
                            src="${firstPlayerTokenUrl}"
                            alt="Ficha del jugador inicial"
                            title="Jugador inicial"
                        >
                    ` : ''}
                </mc-card>
            </div>
        `;
    }
}

window.customElements.define(SuperheroCardComponent.is, SuperheroCardComponent);
