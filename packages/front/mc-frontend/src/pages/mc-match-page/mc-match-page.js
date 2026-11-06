import {LitElement, html} from 'lit-element';

import {Api} from '../../components/api/api.js';
import {Player} from '../../components/api/player.js';
import {
    MENU_OPTION_END,
    MENU_OPTION_FLIP
} from '../../components/cards/characters/mc-superhero-card/mc-superhero-card.js';
import '../../components/views/mc-match/mc-match.js';
import {ABILITY_ID} from '../../misc/utils.js';
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
            dialogBoardPlayerId: {type: String},
            tableConsultationMode: {type: Boolean},
            api: {type: Api},
            firstPlayerTokenUrl: {type: String, attribute: 'first-player-token-url'},
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
        this.dialogBoardPlayerId = '';
        this.tableConsultationMode = false;
        this.firstPlayerTokenUrl = '';

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
    get actionRequest() {
        return this.match?.actionRequest || null;
    }
    getPlayerIdentifier(player) {
        return player?.id || player?.userId || player?.name || '';
    }
    static assertInitiatingPlayer(player, initiatingPlayer) {
        if (player !== initiatingPlayer) {
            throw new Error('El superhéroe seleccionado ha cambiado. Vuelve a iniciar la acción.');
        }
    }
    get canInteract() {
        if (this.tableConsultationMode ||
            this.match?.phase !== 'players' || !this.player) {
            return false;
        }

        const request = this.actionRequest;
        if (request?.status === 'pending') {
            return false;
        }
        if (request?.status === 'accepted') {
            return (request.targetId || request.target) === this.player;
        }

        return this.match.currentTurnPlayer === this.player;
    }
    get canRequestAction() {
        return !this.tableConsultationMode &&
            this.match?.phase === 'players' &&
            this.match.currentTurnPlayer === this.player &&
            !this.actionRequest;
    }
    get canUseOwnTurnOptions() {
        return this.canInteract &&
            this.match.currentTurnPlayer === this.player;
    }
    canActivateAbility(card, abilityIndex) {
        return this.canInteract && (this.canUseOwnTurnOptions ||
            card?.abilities?.[abilityIndex]?.isAction === true);
    }
    canPlayCard(card) {
        return this.canInteract && (this.canUseOwnTurnOptions ||
            (card?.isEvent === true &&
                card.abilities?.some(ability => ability.isAction)));
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

        if (!this.canInteract || !actor || !options?.length) {
            return;
        }

        const allowedOptions = options.filter(option =>
            this.canActivateAbility(actor, option.abilityIndex));
        if (!allowedOptions.length) {
            return;
        }
        this.dragActivation = {actor, options: allowedOptions};
    }
    handleActivationDragEnd() {
        this.dragActivation = null;
    }
    handlePlayCardDragStart(e) {
        if (this.playCardPending || !this.canInteract) {
            return;
        }

        const {card} = e.detail;
        if (card?.playable !== true || !card.id || !this.canPlayCard(card)) {
            return;
        }

        this.dragPlayCard = {
            card,
            cardId: card.id,
            targetIds: card.playableTargetIds || [],
            playablePlayerIds: card.playablePlayerIds || [],
            playableInGameZone: card.playableInGameZone === true,
        };
    }
    handlePlayCardDragEnd() {
        this.dragPlayCard = null;
    }
    handleResourcePaymentDragStart(e) {
        if (this.playCardPending || !this.canInteract) {
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
    updated(changedProperties) {
        if (changedProperties.has('tableConsultationMode') &&
            this.tableConsultationMode) {
            this.clearPlayerTargeting();
        }
        if (changedProperties.has('player') &&
            changedProperties.get('player') !== this.player) {
            this.clearPlayerTargeting();
        }
    }
    clearPlayerTargeting() {
        this.clearDeckTargetSelection();
        this.dragActivation = null;
        this.dragPlayCard = null;
        this.dragResourcePayment = null;
    }
    handleSelectControlledPlayer(event) {
        const selectedPlayer = this.match?.players.find(player =>
            this.getPlayerIdentifier(player) === event.detail?.player);
        const currentPlayer = this.match?.players.find(player =>
            this.getPlayerIdentifier(player) === this.player);
        if (!selectedPlayer?.userId ||
            selectedPlayer.userId !== currentPlayer?.userId ||
            this.playCardPending) {
            event.stopPropagation();
            return;
        }

        this.clearPlayerTargeting();
        this.player = this.getPlayerIdentifier(selectedPlayer);
    }
    handlePlayCardDrop(e) {
        this.dragPlayCard = null;
        if (!this.canInteract) {
            return;
        }

        return this.handleSelectCardHand({
            detail: {
                card: e.detail.card,
                targetCard: e.detail.targetCard,
                targetId: e.detail.targetId,
            },
        });
    }
    async handleResourcePaymentDrop(e) {
        if (!this.canInteract) {
            return;
        }

        const {card, targetCard, option} = e.detail;

        if (!card?.id || !targetCard?.id ||
            !Number.isSafeInteger(option?.abilityIndex) ||
            !option.source || option.cardId !== card.id) {
            return;
        }

        try {
            if (!this.canActivateAbility(targetCard, option.abilityIndex)) {
                throw new Error('Fuera de tu turno solo puedes activar capacidades de Acción.');
            }
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
    async handleRequestPlayerAction(event) {
        const {targetPlayer} = event.detail || {};
        if (!this.canRequestAction || !targetPlayer) {
            return;
        }

        try {
            await this.apiPlayer.requestAction(this.player, targetPlayer);
        } catch (error) {
            this.dispatchEvent(new CustomEvent('communication-error', {
                bubbles: true,
                composed: true,
                detail: {message: error.message},
            }));
        }
    }
    async handleRespondPlayerAction(event) {
        if ((this.actionRequest?.targetId || this.actionRequest?.target) !== this.player ||
            this.actionRequest?.status !== 'pending') {
            return;
        }

        try {
            await this.apiPlayer.respondToActionRequest(
                this.player,
                event.detail?.accept === true
            );
        } catch (error) {
            this.dispatchEvent(new CustomEvent('communication-error', {
                bubbles: true,
                composed: true,
                detail: {message: error.message},
            }));
        }
    }
    async handleCompletePlayerAction() {
        if ((this.actionRequest?.targetId || this.actionRequest?.target) !== this.player ||
            this.actionRequest?.status !== 'accepted') {
            return;
        }

        try {
            await this.apiPlayer.completeRequestedAction(this.player);
        } catch (error) {
            this.dispatchEvent(new CustomEvent('communication-error', {
                bubbles: true,
                composed: true,
                detail: {message: error.message},
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
        if (!this.match) {
            return;
        }
        if (this.updateVillain(card) || this.updateMainScheme(card) ||
            this.updateScenarioZoneCard(card)) {
            return true;
        }
        const players = card.playerId ?
            this.match.players.filter(player =>
                this.getPlayerIdentifier(player) === card.playerId) :
            this.match.players;
        if (card.playerId && !players.length) {
            throw new Error('No se encontró el jugador de la actualización de carta.');
        }
        for (const player of players) {
            if (this.updateSuperhero(player, card) ||
                this.updateMinion(player, card) ||
                this.updateGameZoneCard(player, card)) {
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
    updateHand(update) {
        if (this.match) {
            const hand = Array.isArray(update) ? update : update.hand;
            const playerId = Array.isArray(update) ? this.player : update.playerId;
            const _player = this.match.players.find(player =>
                this.getPlayerIdentifier(player) === playerId);
            if (!_player) {
                throw new Error('No se encontró el jugador de la actualización de mano.');
            }
            this.changePlayer({
                ..._player,
                hand,
            });
        }
    }
    updateMainScheme(card) {
        const {scenario} = this.match;
        const zoneIndex = (scenario.zones || []).findIndex(zone =>
            zone.mainScheme?.id === card.id);

        if (zoneIndex >= 0) {
            const zones = scenario.zones.slice();
            zones[zoneIndex] = {...zones[zoneIndex], mainScheme: card};
            this.changeMatch({
                ...this.match,
                scenario: {
                    ...scenario,
                    zones,
                    ...(scenario.gameZone?.id === zones[zoneIndex].id ?
                        {gameZone: {...scenario.gameZone, mainScheme: card}} :
                        {}),
                    ...(scenario.mainScheme?.id === card.id ?
                        {mainScheme: card} :
                        {}),
                },
            });

            return true;
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
        const {match} = this;

        if (match) {
            const _player = match.players.find(player =>
                player.gameZone.id === playerZone.id);
            if (!_player) {
                throw new Error('No se encontró el jugador de la actualización de zona.');
            }

            this.changePlayer({
                ..._player,
                gameZone: playerZone,
            });
        }
    }
    updateScenarioZone(gameZone) {
        const {match} = this;

        if (match) {
            const zones = match.scenario.zones || [];
            const zoneIndex = zones.findIndex(zone =>
                zone.id === gameZone.id);
            const updatedZones = zoneIndex < 0 ?
                zones.concat(gameZone) :
                zones.map((zone, index) =>
                    index === zoneIndex ? gameZone : zone);
            this.changeMatch({
                ...match,
                scenario: {
                    ...match.scenario,
                    zones: updatedZones,
                    ...(match.scenario.gameZone?.id === gameZone.id ||
                        updatedZones.length === 1 ?
                        {gameZone} :
                        {}),
                },
            });
        }
    }
    updateScenarioZoneCard(card) {
        const {match} = this;
        const zones = match.scenario.zones || [match.scenario.gameZone];
        const zoneIndex = zones.findIndex(zone =>
            zone?.cards?.some(_card => _card.id === card.id));

        if (zoneIndex >= 0) {
            const zone = zones[zoneIndex];
            const foundCard = zone.cards.find(_card => _card.id === card.id);
            const cards = zone.cards.slice();
            const index = cards.indexOf(foundCard);

            cards[index] = card;
            const updatedZone = {...zone, cards};
            const updatedZones = zones.slice();
            updatedZones[zoneIndex] = updatedZone;

            this.changeMatch({
                ...match,
                scenario: {
                    ...match.scenario,
                    zones: updatedZones,
                    ...(match.scenario.gameZone?.id === zone.id ||
                        updatedZones.length === 1 ?
                        {gameZone: updatedZone} :
                        {}),
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
        const {scenario} = this.match;
        const zoneIndex = (scenario.zones || []).findIndex(zone =>
            zone.villain?.id === card.id);

        if (zoneIndex >= 0) {
            const zones = scenario.zones.slice();
            zones[zoneIndex] = {...zones[zoneIndex], villain: card};
            this.changeMatch({
                ...this.match,
                scenario: {
                    ...scenario,
                    zones,
                    ...(scenario.gameZone?.id === zones[zoneIndex].id ?
                        {gameZone: {...scenario.gameZone, villain: card}} :
                        {}),
                    ...(scenario.villain?.id === card.id ?
                        {villain: card} :
                        {}),
                },
            });

            return true;
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
        const playerId = this.getPlayerIdentifier(player);
        const index = players.findIndex(_player =>
            this.getPlayerIdentifier(_player) === playerId
        );
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
        if (!this.canInteract) {
            return;
        }
        if (!this.canActivateAbility(card, abilityIndex)) {
            throw new Error('Fuera de tu turno solo puedes activar capacidades de Acción.');
        }
        if (!card?.id) {
            throw new Error('La capacidad seleccionada no tiene una carta de origen.');
        }

        const targetIds = this.getSelectableDeckIds(
            card.abilities?.[abilityIndex]
        );
        const numericAbilityIndex = Number(abilityIndex);

        if (targetIds.length && Number.isSafeInteger(numericAbilityIndex)) {
            const selection = {
                player: this.player,
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
            McMatchPage.assertInitiatingPlayer(this.player, selection.player);
            if (!this.canInteract) {
                return;
            }
            await this.apiPlayer.resolveAbility(
                selection.player,
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
        if (!this.canInteract) {
            return;
        }

        const {actor, card, option} = e.detail;

        if (!option?.basicActivation) {
            return this.handleTargetedActivationSelection(card, option, actor);
        }

        return this.handleBasicActivationSelection(card, option, actor);
    }
    handleTargetedActivationSelection(card, option, actor) {
        const player = this.match?.players.find(_player =>
            this.getPlayerIdentifier(_player) === this.player
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
        if (!this.canUseOwnTurnOptions) {
            return;
        }
        const player = this.match?.players.find(_player =>
            this.getPlayerIdentifier(_player) === this.player
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

        const initiatingPlayer = this.player;
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
                    McMatchPage.assertInitiatingPlayer(this.player, initiatingPlayer);
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
        const initiatingPlayer = this.player;
        return response => {
            if (response === undefined) {
                return;
            }
            const {selected} = response;
            if (!selected) {
                return;
            }
            McMatchPage.assertInitiatingPlayer(this.player, initiatingPlayer);

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
            if (!this.canInteract) {
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
            this.getPlayerIdentifier(_player) === this.player);

        if (!currentPlayer) {
            return [];
        }

        return getEndTurnConfirmationReasons(currentPlayer);
    }
    endTurn() {
        if (!this.canInteract || this.actionRequest) {
            return;
        }
        const reasons = this.getEndTurnReasons();
        if (reasons.length) {
            const initiatingPlayer = this.player;
            this.dispatchEvent(new CustomEvent('turn-end-confirmation', {
                bubbles: true,
                composed: true,
                detail: {
                    reasons,
                    callback: response => {
                        if (!response?.confirmed) {
                            return;
                        }
                        McMatchPage.assertInitiatingPlayer(this.player, initiatingPlayer);
                        return this.sendEndTurn();
                    },
                },
            }));

            return;
        }

        return this.sendEndTurn();
    }
    sendEndTurn() {
        if (!this.canInteract || this.actionRequest) {
            return Promise.resolve();
        }
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
        if (!this.canUseOwnTurnOptions) {
            return;
        }
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
        if (this.playCardPending || !this.canInteract) {
            return;
        }

        const {apiPlayer, player} = this;
        const {card, targetCard, targetId} = e.detail;

        if (!this.canPlayCard(card)) {
            this.dispatchEvent(new CustomEvent('communication-error', {
                bubbles: true,
                composed: true,
                detail: {
                    message: 'Fuera de tu turno solo puedes jugar eventos con una capacidad de Acción.',
                },
            }));
            return;
        }

        this.playCardPending = true;
        try {
            await apiPlayer.playCard(
                player,
                card.id,
                targetId || targetCard?.id,
            );
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
        const _player = match ? match.players.find(_p =>
            this.getPlayerIdentifier(_p) === player
        ) : null;
        return html`
            <mc-match
                .match="${match}"
                .api="${this.api}"
                .player="${_player}"
                .boardPlayer="${_player}"
                .dialogBoardPlayerId="${this.dialogBoardPlayerId}"
                .tableConsultationMode="${this.tableConsultationMode}"
                .interactive="${this.canInteract}"
                .canRequestAction="${this.canRequestAction}"
                .actionRequest="${this.actionRequest}"
                .firstPlayerTokenUrl="${this.firstPlayerTokenUrl}"
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
                @request-player-action="${this.handleRequestPlayerAction.bind(this)}"
                @respond-player-action="${this.handleRespondPlayerAction.bind(this)}"
                @complete-player-action="${this.handleCompletePlayerAction.bind(this)}"
                @select-controlled-player="${this.handleSelectControlledPlayer.bind(this)}"
            ></mc-match>
        `;
    }
    async resolveActivation(card, option, activator) {
        try {
            if (!this.canInteract) {
                return;
            }
            if (!activator || !Number.isSafeInteger(option.abilityIndex) ||
                !option.targetId) {
                throw new Error('No se pudo iniciar la activación seleccionada.');
            }
            if (!this.canActivateAbility(activator, option.abilityIndex)) {
                throw new Error('Fuera de tu turno solo puedes activar capacidades de Acción.');
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
