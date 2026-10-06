import {LitElement, html} from 'lit-element';

import {Api} from '../../components/api/api.js';
import {Player} from '../../components/api/player.js';
import {
    MENU_OPTION_END,
    MENU_OPTION_FLIP
} from '../../components/cards/characters/mc-superhero-card/mc-superhero-card.js';
import '../../components/views/mc-match/mc-match.js';
import {ABILITY_ID, path} from '../../misc/utils.js';

import styles from './mc-match-page.css.js';

export class McMatchPage extends LitElement {
    static get is() {
        return 'mc-match-page';
    }
    static get styles() {
        return [styles];
    }
    static get properties() {
        return {
            match: {type: Object},
            player: {type: String},
            api: {type: Api},
            playCardPending: {type: Boolean},
        };
    }
    constructor() {
        super();

        this.match = null;
        this.player = '';

        this.api = null;

        this.apiPlayer = null;
        this.playCardPending = false;
    }
    async connectedCallback() {
        super.connectedCallback();

        this.apiPlayer = new Player(this.api);

        this.api.listenCard(this.updateCard.bind(this));
        this.api.listenDeck(this.updateDeck.bind(this));
        this.api.listenHand(this.updateHand.bind(this));
        this.api.listenPlayer(this.updatePlayer.bind(this));
        this.api.listenPlayerZone(this.updatePlayerZone.bind(this));
        this.api.listenScenarioZone(this.updateScenarioZone.bind(this));
        this.api.joinMatch(true);
    }
    updateCard(card) {
        const {match, player} = this;

        if (player) {
            const _player = match.players.find(_p => _p.name === player);

            if (this.updateSuperhero(_player, card)) {
                return true;
            }
            if (this.updateVillain(card)) {
                return true;
            }
            if (this.updateMainScheme(card)) {
                return true;
            }
            if (this.updateScenarioZoneCard(card)) {
                return true;
            }
            if (this.updateMinion(_player, card)) {
                return true;
            }
            if (this.updateGameZoneCard(_player, card)) {
                return true;
            }
        }
    }
    updateDeck(deck) {
        const {match} = this;

        if (match) {
            if (deck.isScenarioDeck) {
                this.changeMatch({
                    ...this.match,
                    scenario: {
                        ...this.match.scenario,
                        deck,
                    },
                });
            } else if (deck.isPlayerDeck) {
                const _player = match.players.find(_p => _p.name === deck.name);

                if (_player) {
                    this.changePlayer({
                        ..._player,
                        deck,
                    });
                }
            }
        }
    }
    updateGameZoneCard(player, card) {
        const foundCard = player.gameZone.cards.find(_card => _card.id === card.id);

        if (foundCard) {
            const cards = player.gameZone.cards.slice();
            const index = cards.indexOf(foundCard);

            cards[index] = card;

            this.changePlayer({
                ...player,
                gameZone: {
                    ...player.gameZone,
                    cards,
                }
            });

            return true;
        }

        return false;
    }
    updateHand(hand) {
        const {match, player} = this;

        if (match && player) {
            const _player = match.players.find(_p => _p.name === player);

            this.changePlayer({
                ..._player,
                hand,
            });
        }
    }
    updateMainScheme(card) {
        const mainScheme = path(this, 'match.scenario.mainScheme');

        if (mainScheme) {
            if (mainScheme.id === card.id) {
                this.changeMatch({
                    ...this.match,
                    scenario: {
                        ...this.match.scenario,
                        mainScheme: card,
                    }
                });

                return true;
            }
        }

        return false;
    }
    updateMinion(player, card) {
        const minion = player.gameZone.minions.find(_minion => _minion.id === card.id);

        if (minion) {
            const minions = player.gameZone.minions.slice();
            const index = minions.indexOf(minion);

            minions[index] = card;

            this.changePlayer({
                ...player,
                gameZone: {
                    ...player.gameZone,
                    minions,
                }
            });

            return true;
        }

        return false;
    }
    updatePlayer(player) {
        const {match} = this;

        if (match) {
            this.changePlayer(player);
        }
    }
    updatePlayerZone(playerZone) {
        const {match, player} = this;

        if (match) {
            const _player = match.players.find(_p => _p.name === player);

            this.changePlayer({
                ..._player,
                gameZone: playerZone,
            });
        }
    }
    updateScenarioZone(gameZone) {
        const {match} = this;

        if (match) {
            this.changeMatch({
                ...match,
                scenario: {
                    ...match.scenario,
                    gameZone,
                },
            });
        }
    }
    updateScenarioZoneCard(card) {
        const {match} = this;
        const foundCard = match.scenario.gameZone.cards.find(_card => _card.id === card.id);

        if (foundCard) {
            const cards = match.scenario.gameZone.cards.slice();
            const index = cards.indexOf(foundCard);

            cards[index] = card;

            this.changeMatch({
                ...match,
                scenario: {
                    ...match.scenario,
                    gameZone: {
                        ...match.scenario.gameZone,
                        cards,
                    }
                }
            });

            return true;
        }

        return false;
    }
    updateSuperhero(player, card) {
        if (player.superhero.id === card.id ||
            player.superhero.id === card.parentId) {
            this.changePlayer({
                ...player,
                superhero: card,
            });

            return true;
        }

        return false;
    }
    updateVillain(card) {
        const villain = path(this, 'match.scenario.villain');

        if (villain) {
            if (villain.id === card.id) {
                this.changeMatch({
                    ...this.match,
                    scenario: {
                        ...this.match.scenario,
                        villain: card,
                    }
                });

                return true;
            }
        }

        return false;
    }
    changeMatch(match) {
        this.match = match;

        this.dispatchEvent(new CustomEvent('change-match', {
            bubbles: true,
            composed: true,
            detail: {match},
        }));
    }
    changePlayer(player) {
        const {match} = this;
        const players = match.players.slice();
        const index = players.findIndex(_player => _player.name === player.name);
        if (index > -1) {
            players[index] = player;
        }

        this.changeMatch({
            ...match,
            players,
        });
    }
    handleAbility(e) {
        const {apiPlayer, player} = this;
        const {card, ability} = e.detail;

        apiPlayer.resolveAbility(player, card.id, ability);
    }
    handleChangeMenu(e) {
        e.stopPropagation();
        const {card} = e.detail;

        this.dispatchEvent(new CustomEvent('change-menu', {
            bubbles: true,
            composed: true,
            detail: {
                ...e.detail,
                callback: this.handleMenuOption(card),
            }
        }));
    }
    handleMenuOption(card) {
        return response => {
            if (response === undefined) {
                return;
            }

            const {selected} = response;
            const {apiPlayer, player} = this;

            switch (selected.id) {
                case MENU_OPTION_END:
                    this.endTurn();
                    break;
                case MENU_OPTION_FLIP:
                    apiPlayer.flip(player);
                    break;
                default:
                    const index = selected.id.substring(ABILITY_ID.length, selected.id.length);
                    apiPlayer.resolveAbility(player, card.id, index);
            }
        };
    }
    handlePlayerEnd() {
        this.endTurn();
    }
    endTurn() {
        this.apiPlayer.endTurn(this.player).catch(error => {
            this.dispatchEvent(new CustomEvent('communication-error', {
                bubbles: true,
                composed: true,
                detail: {
                    message: error.message,
                },
            }));
        });
    }
    handleFlipSuperhero() {
        const {apiPlayer, player} = this;

        apiPlayer.flip(player);
    }
    async handleSelectCardHand(e) {
        if (this.playCardPending) {
            return;
        }

        const {apiPlayer, player} = this;
        const {card} = e.detail;

        this.playCardPending = true;
        try {
            await apiPlayer.playCard(player, card.id);
        } catch (error) {
            this.dispatchEvent(new CustomEvent('communication-error', {
                bubbles: true,
                composed: true,
                detail: {
                    message: error.message,
                },
            }));
        } finally {
            this.playCardPending = false;
        }
    }
    render() {
        const {match, player} = this;
        const _player = match ? match.players.find(_p => _p.name === player) : null;

        return html`
            <mc-match
                .match="${match}"
                .player="${_player}"
                .playCardPending="${this.playCardPending}"
                @change-menu="${this.handleChangeMenu.bind(this)}"
                @superhero-flip="${this.handleFlipSuperhero.bind(this)}"
                @ability="${this.handleAbility.bind(this)}"
                @hand-select-card="${this.handleSelectCardHand.bind(this)}"
                @player-end="${this.handlePlayerEnd.bind(this)}"
            ></mc-match>
        `;
    }
}

window.customElements.define(McMatchPage.is, McMatchPage);
