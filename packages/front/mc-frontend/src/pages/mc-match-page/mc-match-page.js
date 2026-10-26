import {LitElement, html} from 'lit-element';

import {Api} from '../../components/api/api.js';
import {Player} from '../../components/api/player.js';
import {
    MENU_OPTION_END,
    MENU_OPTION_FLIP
} from '../../components/cards/characters/mc-superhero-card/mc-superhero-card.js';
import '../../components/views/mc-match/mc-match.js';
import {ABILITY_ID, path} from '../../misc/utils.js';
import {MENU_OPTION_VIEW_TUCKED_CARDS} from '../../misc/card-menu.js';
import {getEndTurnConfirmationReasons} from '../../utils/end-turn.js';
import {
    getActivationOptionForActor,
    getBasicActivationOptionForActor,
} from '../../utils/basic-activation.js';

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
            dragActivation: {type: Object},
            dragPlayCard: {type: Object},
            dragResourcePayment: {type: Object},
            deckTargetSelection: {type: Object},
        };
    }
    constructor() {
        super();

        this.match = null;
        this.player = '';

        this.api = null;

        this.apiPlayer = null;
        this.playCardPending = false;
        this.dragActivation = null;
        this.dragPlayCard = null;
        this.dragResourcePayment = null;
        this.deckTargetSelection = null;
        this.deckTargetDocumentClickHandler = null;
        this.deckTargetDocumentClickListenerAttached = false;
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
    handleActivationDragStart(e) {
        const {actor, options} = e.detail;

        if (!actor || !options?.length) {
            return;
        }

        this.dragActivation = {actor, options};
    }
    handleActivationDragEnd() {
        this.dragActivation = null;
    }
    handlePlayCardDragStart(e) {
        if (this.playCardPending) {
            return;
        }

        const {card} = e.detail;
        if (card?.playable !== true || !card.id) {
            return;
        }

        this.dragPlayCard = {
            card,
            cardId: card.id,
            targetIds: card.playableTargetIds || [],
            playableInGameZone: card.playableInGameZone === true,
        };
    }
    handlePlayCardDragEnd() {
        this.dragPlayCard = null;
    }
    handleResourcePaymentDragStart(e) {
        if (this.playCardPending) {
            return;
        }

        const {card, source} = e.detail;
        if (!card?.id || !source) {
            return;
        }

        this.dragResourcePayment = {card, source};
    }
    handleResourcePaymentDragEnd() {
        this.dragResourcePayment = null;
    }
    disconnectedCallback() {
        this.clearDeckTargetSelection();
        super.disconnectedCallback();
    }
    handlePlayCardDrop(e) {
        this.dragPlayCard = null;
        return this.handleSelectCardHand({
            detail: {
                card: e.detail.card,
                targetCard: e.detail.targetCard,
            },
        });
    }
    async handleResourcePaymentDrop(e) {
        const {card, targetCard, option} = e.detail;

        if (!card?.id || !targetCard?.id ||
            !Number.isSafeInteger(option?.abilityIndex) ||
            !option.source || option.cardId !== card.id) {
            return;
        }

        try {
            await this.apiPlayer.resolveAbility(
                this.player,
                targetCard.id,
                option.abilityIndex,
                undefined,
                {
                    cardId: card.id,
                    source: option.source,
                }
            );
        } catch (error) {
            this.dispatchEvent(new CustomEvent('communication-error', {
                bubbles: true,
                composed: true,
                detail: {
                    message: error.message,
                },
            }));
        }
    }
    getBasicActivationPreferenceKey() {
        const matchId = this.match?.id ?? this.match?.name;

        return matchId && this.player ?
            `mc-match:${matchId}:${this.player}:hide-basic-activation-confirmation` :
            '';
    }
    shouldSkipBasicActivationConfirmation() {
        const key = this.getBasicActivationPreferenceKey();

        return Boolean(
            key &&
            globalThis.window?.sessionStorage?.getItem(key) === 'true'
        );
    }
    rememberBasicActivationConfirmationChoice() {
        const key = this.getBasicActivationPreferenceKey();

        if (key) {
            globalThis.window?.sessionStorage?.setItem(key, 'true');
        }
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
            if (deck.isScenarioExtraDeck) {
                if (!deck.id) {
                    throw new Error('A scenario extra deck refresh requires a deck ID.');
                }

                this.changeMatch({
                    ...this.match,
                    scenario: {
                        ...this.match.scenario,
                        extraDecks: {
                            ...this.match.scenario.extraDecks,
                            [deck.id]: deck,
                        },
                    },
                });
            } else if (deck.isScenarioDeck) {
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
            } else if (deck.isPlayerExtraDeck) {
                const _player = match.players.find(_p =>
                    _p.name === deck.ownerName);

                if (_player && deck.id) {
                    this.changePlayer({
                        ..._player,
                        extraDecks: {
                            ...(_player.extraDecks || {}),
                            [deck.id]: deck,
                        },
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
    async handleAbility(e) {
        const {card, ability} = e.detail;

        try {
            await this.resolveAbilityOrSelectDeck(card, ability);
        } catch (error) {
            this.dispatchEvent(new CustomEvent('communication-error', {
                bubbles: true,
                composed: true,
                detail: {
                    message: error.message,
                },
            }));
        }
    }
    getSelectableDeckIds(ability) {
        if (ability?.targetSelectionMode !== 'deck' ||
            !Array.isArray(ability.availableTargetIds)) {
            return [];
        }

        const availableTargetIds = new Set(ability.availableTargetIds);
        const decks = [
            this.match?.scenario?.deck,
            ...(this.match?.players || []).map(candidate => candidate.deck),
        ];

        return decks
            .filter(deck =>
                typeof deck?.id === 'string' &&
                Array.isArray(deck.cards) &&
                deck.cards.length > 0 &&
                availableTargetIds.has(deck.id)
            )
            .map(deck => deck.id);
    }
    resolveAbilityOrSelectDeck(card, abilityIndex) {
        if (!card?.id) {
            throw new Error('La capacidad seleccionada no tiene una carta de origen.');
        }

        const targetIds = this.getSelectableDeckIds(
            card.abilities?.[abilityIndex]
        );
        const numericAbilityIndex = Number(abilityIndex);

        if (targetIds.length && Number.isSafeInteger(numericAbilityIndex)) {
            const selection = {
                cardId: card.id,
                abilityIndex: numericAbilityIndex,
                targetIds,
            };
            this.deckTargetSelection = selection;

            if (globalThis.document?.addEventListener) {
                this.deckTargetDocumentClickHandler ??=
                    this.handleDeckTargetDocumentClick.bind(this);
                queueMicrotask(() => {
                    if (this.deckTargetSelection !== selection ||
                        this.deckTargetDocumentClickListenerAttached ||
                        !globalThis.document?.addEventListener) {
                        return;
                    }

                    globalThis.document.addEventListener(
                        'click',
                        this.deckTargetDocumentClickHandler,
                        true
                    );
                    this.deckTargetDocumentClickListenerAttached = true;
                });
            }

            return;
        }

        return this.apiPlayer.resolveAbility(
            this.player,
            card.id,
            abilityIndex
        );
    }
    handleDeckTargetDocumentClick(event) {
        const clickedDeckEye = event.composedPath?.().some(target =>
            typeof target?.hasAttribute === 'function' &&
            target.hasAttribute('data-deck-target-eye')
        );

        if (clickedDeckEye) {
            return;
        }

        event.preventDefault?.();
        event.stopPropagation?.();
        this.clearDeckTargetSelection();
    }
    clearDeckTargetSelection() {
        this.deckTargetSelection = null;
        if (this.deckTargetDocumentClickListenerAttached) {
            globalThis.document?.removeEventListener(
                'click',
                this.deckTargetDocumentClickHandler,
                true
            );
            this.deckTargetDocumentClickListenerAttached = false;
        }
    }
    async handleDeckTargetSelect(event) {
        event.stopPropagation();

        const selection = this.deckTargetSelection;
        const {deckId} = event.detail || {};
        if (!selection || !selection.targetIds.includes(deckId)) {
            return;
        }

        this.clearDeckTargetSelection();
        try {
            await this.apiPlayer.resolveAbility(
                this.player,
                selection.cardId,
                selection.abilityIndex,
                deckId
            );
        } catch (error) {
            this.dispatchEvent(new CustomEvent('communication-error', {
                bubbles: true,
                composed: true,
                detail: {
                    message: error.message,
                },
            }));
        }
    }
    handleBasicActivation(e) {
        e.stopPropagation();

        const {actor, card, option} = e.detail;

        if (!option?.basicActivation) {
            return this.handleTargetedActivationSelection(card, option, actor);
        }

        return this.handleBasicActivationSelection(card, option, actor);
    }
    handleTargetedActivationSelection(card, option, actor) {
        const player = this.match?.players.find(_player =>
            _player.name === this.player
        );

        if (!player || !card || !option) {
            return;
        }

        const availableActors = [
            player.superhero,
            ...(player.gameZone?.cards || []),
            ...(player.superhero?.attached || []),
        ].filter(candidate =>
            candidate === player.superhero ||
            candidate.isAlly ||
            candidate.isUpgrade ||
            candidate.isSupport
        );
        const activator = actor ?
            availableActors.find(candidate => candidate.id === actor.id) :
            player.superhero;
        const validOption = activator ?
            getActivationOptionForActor(activator, card) :
            undefined;

        if (
            !activator ||
            !validOption ||
            validOption.basicActivation ||
            validOption.abilityIndex !== option.abilityIndex ||
            validOption.targetId !== option.targetId
        ) {
            return;
        }

        return this.resolveActivation(card, validOption, activator);
    }
    handleBasicActivationSelection(card, option, actor) {
        const player = this.match?.players.find(_player =>
            _player.name === this.player
        );

        if (!player || !card || !option?.basicActivation) {
            return;
        }

        const availableActors = [
            player.superhero,
            ...(player.gameZone?.cards || []).filter(candidate =>
                candidate.isAlly
            ),
        ];
        const activator = actor ?
            availableActors.find(candidate => candidate.id === actor.id) :
            player.superhero;
        const validOption = activator ?
            getBasicActivationOptionForActor(
                activator,
                card,
                option.activationType
            ) :
            undefined;

        if (
            !activator ||
            !validOption ||
            validOption.abilityIndex !== option.abilityIndex ||
            validOption.targetId !== option.targetId
        ) {
            return;
        }

        if (this.shouldSkipBasicActivationConfirmation()) {
            return this.resolveActivation(card, option, activator);
        }

        this.dispatchEvent(new CustomEvent('basic-activation-confirmation', {
            bubbles: true,
            composed: true,
            detail: {
                basicActivation: {
                    activator,
                    target: card,
                    activationType: option.activationType,
                },
                callback: response => {
                    if (!response?.confirmed) {
                        return;
                    }
                    if (response.skipBasicActivationConfirmation) {
                        this.rememberBasicActivationConfirmationChoice();
                    }

                    return this.resolveActivation(card, option, activator);
                },
            },
        }));
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

            if (selected.id === MENU_OPTION_VIEW_TUCKED_CARDS) {
                this.dispatchEvent(new CustomEvent('view-tucked-cards', {
                    bubbles: true,
                    composed: true,
                    detail: {
                        card,
                        cards: card.tuckedCards || [],
                    },
                }));
                return;
            }
            if (selected.basicActivation) {
                return this.handleBasicActivationSelection(card, selected);
            }

            switch (selected.id) {
                case MENU_OPTION_END:
                    return this.endTurn();
                case MENU_OPTION_FLIP:
                    return this.flipSuperhero();
                default:
                    const index = Number(selected.id.substring(ABILITY_ID.length));
                    return this.resolveAbilityOrSelectDeck(card, index);
            }
        };
    }
    handlePlayerEnd() {
        this.endTurn();
    }
    getEndTurnReasons() {
        const currentPlayer = this.match?.players.find(_player =>
            _player.name === this.player);

        if (!currentPlayer) {
            return [];
        }

        return getEndTurnConfirmationReasons(currentPlayer);
    }
    endTurn() {
        const reasons = this.getEndTurnReasons();
        if (reasons.length) {
            this.dispatchEvent(new CustomEvent('turn-end-confirmation', {
                bubbles: true,
                composed: true,
                detail: {
                    reasons,
                    callback: response => response?.confirmed ?
                        this.sendEndTurn() :
                        undefined,
                },
            }));

            return;
        }

        return this.sendEndTurn();
    }
    sendEndTurn() {
        return this.apiPlayer.endTurn(this.player).catch(error => {
            this.dispatchEvent(new CustomEvent('communication-error', {
                bubbles: true,
                composed: true,
                detail: {
                    message: error.message,
                },
            }));
        });
    }
    async flipSuperhero() {
        const {apiPlayer, player} = this;

        try {
            this.changePlayer(await apiPlayer.flip(player));
        } catch (error) {
            this.dispatchEvent(new CustomEvent('communication-error', {
                bubbles: true,
                composed: true,
                detail: {
                    message: error.message,
                },
            }));
        }
    }
    handleFlipSuperhero() {
        return this.flipSuperhero();
    }
    async handleSelectCardHand(e) {
        if (this.playCardPending) {
            return;
        }

        const {apiPlayer, player} = this;
        const {card, targetCard} = e.detail;

        this.playCardPending = true;
        try {
            await apiPlayer.playCard(player, card.id, targetCard?.id);
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
                .deckSelectionTargetIds="${this.deckTargetSelection?.targetIds || []}"
                .dragActivation="${this.dragActivation}"
                .dragPlayCard="${this.dragPlayCard}"
                .dragResourcePayment="${this.dragResourcePayment}"
                @change-menu="${this.handleChangeMenu.bind(this)}"
                @basic-activation="${this.handleBasicActivation.bind(this)}"
                @activation-drag-start="${this.handleActivationDragStart.bind(this)}"
                @activation-drag-end="${this.handleActivationDragEnd.bind(this)}"
                @play-card-drag-start="${this.handlePlayCardDragStart.bind(this)}"
                @play-card-drag-end="${this.handlePlayCardDragEnd.bind(this)}"
                @play-card-drop="${this.handlePlayCardDrop.bind(this)}"
                @resource-payment-drag-start="${this.handleResourcePaymentDragStart.bind(this)}"
                @resource-payment-drag-end="${this.handleResourcePaymentDragEnd.bind(this)}"
                @resource-payment-drop="${this.handleResourcePaymentDrop.bind(this)}"
                @superhero-flip="${this.handleFlipSuperhero.bind(this)}"
                @ability="${this.handleAbility.bind(this)}"
                @deck-target-select="${this.handleDeckTargetSelect.bind(this)}"
                @hand-select-card="${this.handleSelectCardHand.bind(this)}"
                @player-end="${this.handlePlayerEnd.bind(this)}"
            ></mc-match>
        `;
    }
    async resolveActivation(card, option, activator) {
        try {
            if (!activator || !Number.isSafeInteger(option.abilityIndex) ||
                !option.targetId) {
                throw new Error('No se pudo iniciar la activación seleccionada.');
            }

            await this.apiPlayer.resolveAbility(
                this.player,
                activator.id,
                option.abilityIndex,
                option.targetId
            );
        } catch (error) {
            this.dispatchEvent(new CustomEvent('communication-error', {
                bubbles: true,
                composed: true,
                detail: {
                    message: error.message,
                },
            }));
        }
    }
}

window.customElements.define(McMatchPage.is, McMatchPage);
