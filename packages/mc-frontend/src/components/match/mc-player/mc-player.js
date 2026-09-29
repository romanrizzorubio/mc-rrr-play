import {LitElement, html} from 'lit-element';
import styles from './mc-player.css.js';

import "../../panels/mc-deck/mc-deck.js";
import "../../panels/mc-hand/mc-hand.js";
import "../../panels/mc-game-zone/mc-game-zone.js";
import "../../cards/characters/mc-superhero-card/mc-superhero-card.js";

import {DECK_TYPES} from "../../panels/mc-deck/mc-deck.js";
import {Player} from "../../api/player.js";
import {Api} from "../../api/api.js";
import {path} from "../../../misc/utils.js";

export class McPlayer extends LitElement {
    static get is() {
        return 'mc-player';
    }
    static get styles() {
        return styles;
    }
    static get properties() {
        return {
            player: {type: Object},
        };
    }
    constructor() {
        super();

        this.player = null;
    }
    handleChangeMenu(e) {
        e.stopPropagation();

        const {
            player: {
                superhero
            }
        } = this;

        this.dispatchEvent(new CustomEvent('change-menu', {
            bubbles: true,
            composed: true,
            detail: {
                ...e.detail,
                card: superhero,
            },
        }));
    }
    handelSuperheroAbility(e) {
        e.stopPropagation();

        const {
            player: {
                superhero
            }
        } = this;

        this.dispatchEvent(new CustomEvent('superhero-ability', {
            bubbles: true,
            composed: true,
            detail: {
                ...e.detail,
                card: superhero,
            },
        }))
    }
    renderHand() {
        const {
            player: {
                hand
            }
        } = this;

        return html`
            <mc-hand
                .cards="${hand}"
            ></mc-hand>
        `;
    }
    renderSuperhero() {
        const {
            player: {
                superhero: {
                    name, image, life, flipped, exhausted, statusCards, abilities
                }
            }
        } = this;

        return html`
            <mc-superhero-card
                class="panel"
                name="${name}"
                image="${image}"
                life="${life}"
                .abilities="${abilities}"
                .flipped="${flipped}"
                .statusCards="${statusCards}"
                .exhausted="${exhausted}"
                @change-menu="${this.handleChangeMenu.bind(this)}"
                @superhero-ability="${this.handelSuperheroAbility.bind(this)}"
            ></mc-superhero-card>
        `;
    }
    renderGameZone() {
        const gameZone = path(this, 'player.gameZone');

        return gameZone && html`
            <mc-game-zone
                class="panel"
                encounters="${gameZone.encounters}"
                .cards="${gameZone.cards}"
                .minions="${gameZone.minions}"
            ></mc-game-zone>
        `;
    }
    renderDeck() {
        const cards = path(this, 'player.deck.cards');
        const discard = path(this, 'player.deck.discard');

        return cards && discard ? html`
            <mc-deck
                class="panel"
                .cards="${cards}"
                .discard="${discard}"
                type="${DECK_TYPES.PLAYER}"
            ></mc-deck>
        ` : '';
    }
    render() {
        const {player} = this;

        return player ?
            html`
                ${this.renderDeck()}
                ${this.renderSuperhero()}
                ${this.renderGameZone()}
                ${this.renderHand()}
            ` : '';
    }
}

window.customElements.define(McPlayer.is, McPlayer);
