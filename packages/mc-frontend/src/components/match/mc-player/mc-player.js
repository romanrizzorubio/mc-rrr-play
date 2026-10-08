import {LitElement, html} from 'lit-element';

import {DECK_TYPES} from '../../panels/mc-deck/mc-deck.js';

import styles from './mc-player.css.js';
import '../../panels/mc-hand/mc-hand.js';
import '../../panels/mc-game-zone/mc-game-zone.js';
import '../../cards/characters/mc-superhero-card/mc-superhero-card.js';
import {path} from '../../../misc/utils.js';

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
            canEndTurn: {type: Boolean},
            playCardPending: {type: Boolean},
        };
    }
    constructor() {
        super();

        this.player = null;
        this.canEndTurn = false;
        this.playCardPending = false;
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
        }));
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
                .playCardPending="${this.playCardPending}"
            ></mc-hand>
        `;
    }
    renderSuperhero() {
        const {
            player: {
                handSize,
                superhero: {
                    name, image, life, hitPoints, attack, thwart, defense, recovery,
                    flipped, exhausted, statusCards, abilities, extraTraits = [],
                    extraKeywords = []
                }
            }
        } = this;

        return html`
            <mc-superhero-card
                class="panel"
                name="${name}"
                image="${image}"
                .canEndTurn="${this.canEndTurn}"
                .life="${life}"
                .hitPoints="${hitPoints}"
                .handSize="${handSize}"
                .attack="${attack}"
                .thwart="${thwart}"
                .defense="${defense}"
                .recovery="${recovery}"
                .abilities="${abilities}"
                .extraTraits="${extraTraits}"
                .extraKeywords="${extraKeywords}"
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
        const attachedUpgrades = path(this, 'player.superhero.attached') || [];

        return gameZone && html`
            <mc-game-zone
                class="panel"
                encounters="${gameZone.encounters}"
                .cards="${gameZone.cards}"
                .attachedUpgrades="${attachedUpgrades}"
                .minions="${gameZone.minions}"
            ></mc-game-zone>
        `;
    }
    renderDeck() {
        const {name} = this.player;
        const cards = path(this, 'player.deck.cards');
        const discard = path(this, 'player.deck.discard');

        return cards && discard ? html`
            <mc-deck
                class="panel"
                .cards="${cards}"
                .discard="${discard}"
                discard-label="Descarte de ${name}"
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
