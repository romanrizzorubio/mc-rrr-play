import {LitElement, html} from 'lit-element';

import {DECK_TYPES} from '../../panels/mc-deck/mc-deck.js';

import styles from './mc-player.css.js';
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
            deckSelectionTargetIds: {type: Array},
            dragActivation: {type: Object},
            dragPlayCard: {type: Object},
            dragResourcePayment: {type: Object},
        };
    }
    constructor() {
        super();

        this.player = null;
        this.canEndTurn = false;
        this.deckSelectionTargetIds = [];
        this.dragActivation = null;
        this.dragPlayCard = null;
        this.dragResourcePayment = null;
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
    isDeckSelectable(deck) {
        return Boolean(
            deck?.id &&
            this.deckSelectionTargetIds.includes(deck.id)
        );
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
    renderSuperhero() {
        const {
            player: {
                handSize,
                superhero,
                gameZone,
            },
        } = this;
        const {
            name, image, life, hitPoints, attack, thwart, defense, recovery,
            flipped, exhausted, statusCards, canFlip = false, abilities, extraTraits = [],
            extraKeywords = [], attached = [], tuckedCards = [], aspectMarkers = []
        } = superhero;
        const attachedCards = attached.filter(card => !card.isUpgrade);
        const obligations = gameZone?.cards?.filter(card => card.isObligation) || [];

        return html`
            <mc-superhero-card
                class="panel"
                name="${name}"
                image="${image}"
                .activationActor="${superhero}"
                .dragActivation="${this.dragActivation}"
                .dragPlayCard="${this.dragPlayCard}"
                .dragResourcePayment="${this.dragResourcePayment}"
                .card="${superhero}"
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
                .aspectMarkers="${aspectMarkers}"
                .flipped="${flipped}"
                .statusCards="${statusCards}"
                .canFlip="${canFlip}"
                .attached="${attachedCards}"
                .tuckedCards="${tuckedCards}"
                .obligations="${obligations}"
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
                .player="${this.player}"
                encounters="${gameZone.encounters}"
                .cards="${gameZone.cards}"
                .attachedUpgrades="${attachedUpgrades}"
                .minions="${gameZone.minions}"
                .dragActivation="${this.dragActivation}"
                .dragPlayCard="${this.dragPlayCard}"
                .dragResourcePayment="${this.dragResourcePayment}"
            ></mc-game-zone>
        `;
    }
    renderDeck() {
        const {name, deck} = this.player;

        return deck?.cards && deck?.discard ? html`
            <mc-deck
                class="panel"
                .cards="${deck.cards}"
                .discard="${deck.discard}"
                .knownCards="${deck.knownCards || []}"
                .deckName="${name}"
                .targetId="${deck.id || ''}"
                .targetSelectable="${this.isDeckSelectable(deck)}"
                .showDeckName="${false}"
                discard-label="Descarte de ${name}"
                .highlightPlayableDiscard="${true}"
                .dragActivation="${this.dragActivation}"
                .dragPlayCard="${this.dragPlayCard}"
                .dragResourcePayment="${this.dragResourcePayment}"
                type="${DECK_TYPES.PLAYER}"
            ></mc-deck>
        ` : '';
    }
    renderExtraDecks() {
        const extraDecks = Object.values(this.player.extraDecks || {});

        return extraDecks.length ? html`
            <div class="extra-decks">
                ${extraDecks.map(deck => html`
                    <mc-deck
                        .cards="${deck.cards || []}"
                        .discard="${deck.discard || []}"
                        .topCard="${deck.topCard}"
                        .topCardFaceUp="${deck.topCardFaceUp === true}"
                        .knownCards="${deck.knownCards || []}"
                        .deckName="${deck.name}"
                        .deckNameSpansPiles="${true}"
                        .dragActivation="${this.dragActivation}"
                        .dragPlayCard="${this.dragPlayCard}"
                        .dragResourcePayment="${this.dragResourcePayment}"
                        type="${DECK_TYPES.PLAYER}"
                        deck-name-position="top"
                        discard-label="Descarte de ${deck.name}"
                    ></mc-deck>
                `)}
            </div>
        ` : '';
    }
    renderPlayerDecks() {
        return html`
            <div class="player-decks">
                ${this.renderExtraDecks()}
                ${this.renderDeck()}
            </div>
        `;
    }
    render() {
        const {player} = this;

        return player ?
            html`
                ${this.renderPlayerDecks()}
                ${this.renderSuperhero()}
                ${this.renderGameZone()}
            ` : '';
    }
}

window.customElements.define(McPlayer.is, McPlayer);
