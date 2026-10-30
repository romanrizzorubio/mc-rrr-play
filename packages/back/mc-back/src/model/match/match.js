import {EVENTS, REFRESH_EVENTS} from 'mc-endpoints';
import {DIALOG_LIST} from 'mc-shared';
import {PlayMatchEffect} from '../../effects/play-match-effect.js';
import {Engine} from '../../engine/engine.js';
import {checkCondition, path} from '../../engine/utils.js';
import {cardsShareUniqueIdentity} from '../../utils/unique-card-utils.js';

import {Player} from './player.js';
import {PutPlayEffect} from '../../effects/put-play-effect.js';

export class Match extends Engine {
    constructor({
        mc,
        name,
        id = name,
        lobbyId,
        creatorUserId,
    }) {
        super(arguments[0]);

        this.mc = mc;
        this.name = name;
        this.id = id;
        this.lobbyId = lobbyId;
        this.creatorUserId = creatorUserId;
        this.actionRequest = null;
        this.expert = false;
        this.creationConfig = {
            players: [],
            scenario: null,
            expert: false,
        };

        this.villains = [];
        this.players = [];
        this.removedCards = [];
        this.scenario = null;
        this.playing = false;
        this.gameOverReason = null;
        this.initialized = false;
        this.initializing = false;
        this.phase = null;
        this.turnIndex = 0;
        this.turnStartProcessed = false;
        this.endPlayerIndex = 0;
        this.villainPhaseStep = 0;
        this.facedownMinionSequence = 0;
        this.skipDiscardOrderDialog = false;
        this.skipBoostDealtNotification = false;
        this.skipSurgeNotification = false;
        this.suppressedInformationalDialogIds = [];

        this.lasting = [];
        this.limits = {};
        this.triggerCards = {};
        this.copyIndexesByCardId = new Map();
    }
    get accelerationIcons() {
        let count = this.scenario.accelerationIcons;

        this.players.forEach(player => {
            count += player.accelerationIcons;
        });

        return count;
    }
    get accelerationPlus() {
        return this.accelerationIcons + this.accelerationTokens;
    }
    get accelerationTokens() {
        let count = this.scenario.accelerationTokens;

        this.players.forEach(player => {
            count += player.accelerationTokens;
        });

        return count;
    }
    get amplificationIcons() {
        let count = this.scenario.amplificationIcons;

        this.players.forEach(player => {
            count += player.amplificationIcons;
        });

        return count;
    }
    get characters() {
        return this.enemies.concat(this.friends);
    }
    get enemies() {
        const enemies = this.minions;

        enemies.push(this.scenario.villain);

        return enemies;
    }
    get friends() {
        let friends = [];

        this.players.forEach(player => {
            friends = friends.concat(player.friends);
        });

        return friends;
    }
    get hasCrisis() {
        return this.scenario.hasCrisis ||
            this.players.some(player => player.hasCrisis);
    }
    get hasEncounters() {
        return this.players.some(player => player.encounters.length);
    }
    get hazardIcons() {
        let count = this.scenario.hazardIcons;

        this.players.forEach(player => {
            count += player.hazardIcons;
        });

        return count;
    }
    get heroes() {
        return this.players.filter(player => player.isHero);
    }
    get heroesAndAllies() {
        return this.players.reduce((ret, player) => {
            if (player.isHero) {
                ret.push(player.superhero);
            }

            return ret.concat(player.allies);
        }, []);
    }
    get initialPlayer() {
        return this.players.find(player => player.initial);
    }
    get inPlayCards() {
        const cards = [];
        const seen = new Set();
        const addCard = card => {
            if (!card || seen.has(card)) {
                return;
            }

            seen.add(card);
            cards.push(card);
            card.attached?.forEach(addCard);
        };

        addCard(this.scenario?.villain);
        addCard(this.mainScheme);
        (this.scenario?.zones ?? [this.scenario?.gameZone])
            .filter(Boolean)
            .forEach(zone => zone.inPlayCards.forEach(addCard));
        this.players.forEach(player => {
            addCard(player.superhero);
            (player.gameZone?.inPlayCards ?? []).forEach(addCard);
            (player.minions ?? []).forEach(addCard);
        });

        return cards;
    }
    get mainScheme() {
        return path(this, 'scenario.mainScheme');
    }
    getScenarioZone(player) {
        return this.scenario?.getZoneForPlayer?.(player) ??
            player?.scenarioZone ??
            this.scenario?.gameZone;
    }
    getScenarioZoneForCard(card) {
        return card?.scenarioZone ??
            card?.controller?.scenarioZone ??
            card?.owner?.scenarioZone ??
            card?.engaged?.scenarioZone ??
            card?.attachedTo?.scenarioZone ??
            card?.parent?.scenarioZone;
    }
    isScenarioZoneAbilityAllowed(ability, params = {}) {
        if (!this.scenario?.separatePlayAreas || ability?.globalScope) {
            return true;
        }

        const sourceZone = this.getScenarioZoneForCard(ability?.card);
        const eventPlayer = params.player ??
            params.effect?.player ??
            params.effect?.enemy?.owner;
        const eventZone = eventPlayer?.scenarioZone ??
            params.card?.scenarioZone ??
            params.effect?.selectedTarget?.scenarioZone ??
            params.effect?.enemy?.scenarioZone;

        return !sourceZone || !eventZone || sourceZone === eventZone;
    }
    getMainSchemeFor(player) {
        const zone = this.getScenarioZone(player);
        return zone?.currentScheme?.currentSide ??
            zone?.mainScheme?.currentSide ??
            zone?.mainScheme ??
            this.scenario?.mainScheme?.currentSide ??
            this.scenario?.mainScheme ??
            this.scenario?.schemes?.find(scheme => scheme.isMainScheme);
    }
    getVillainFor(player) {
        const zone = this.getScenarioZone(player);
        return zone?.currentVillain ??
            zone?.villain ??
            this.scenario?.villain;
    }
    getSchemesFor(player) {
        const zone = this.getScenarioZone(player);
        if (Array.isArray(zone?.schemes)) {
            return zone.schemes;
        }

        return zone && this.scenario?.separatePlayAreas ?
            [] :
            this.scenario?.schemes ?? [];
    }
    getSideSchemesFor(player) {
        const zone = this.getScenarioZone(player);
        if (Array.isArray(zone?.sideSchemes)) {
            return zone.sideSchemes;
        }
        if (zone?.cards) {
            return zone.cards.filter(card => card.isSideScheme);
        }

        return zone && this.scenario?.separatePlayAreas ?
            [] :
            this.scenario?.sideSchemes ?? [];
    }
    getPlayersFor(player) {
        if (!player) {
            return this.players;
        }

        const zone = this.getScenarioZone(player);
        return zone?.players?.length ?
            zone.players :
            this.scenario?.separatePlayAreas ?
                [player] :
                this.players;
    }
    getMinionsFor(player) {
        return this.getPlayersFor(player).flatMap(zonePlayer =>
            zonePlayer.minions ?? []);
    }
    getEnemiesFor(player) {
        if (!this.scenario?.separatePlayAreas) {
            return this.enemies;
        }

        return [
            ...this.getMinionsFor(player),
            this.getVillainFor(player),
        ].filter(Boolean);
    }
    getFriendsFor(player) {
        return this.getPlayersFor(player).flatMap(zonePlayer =>
            zonePlayer.friends ?? []);
    }
    getCharactersFor(player) {
        return this.getEnemiesFor(player).concat(this.getFriendsFor(player));
    }
    getInPlayCardsFor(player) {
        if (!player) {
            return this.inPlayCards;
        }

        const zone = this.getScenarioZone(player);
        const cards = [
            ...(zone?.inPlayCards ?? []),
            ...this.getPlayersFor(player).flatMap(zonePlayer => [
                zonePlayer.superhero,
                ...(zonePlayer.gameZone?.inPlayCards ?? []),
                ...(zonePlayer.minions ?? []),
            ]),
        ];

        return [...new Set(cards.filter(Boolean))];
    }
    getHazardIconsFor() {
        return this.hazardIcons;
    }
    getAccelerationIconsFor(player) {
        return (this.getScenarioZone(player)?.accelerationIcons ?? 0) +
            this.getPlayersFor(player).reduce((total, zonePlayer) =>
                total + zonePlayer.accelerationIcons, 0);
    }
    getAccelerationTokensFor(player) {
        return (this.getScenarioZone(player)?.accelerationTokens ?? 0) +
            this.getPlayersFor(player).reduce((total, zonePlayer) =>
                total + zonePlayer.accelerationTokens, 0);
    }
    getAccelerationPlusFor(player) {
        return this.getAccelerationIconsFor(player) +
            this.getAccelerationTokensFor(player);
    }
    getAmplificationIconsFor(player) {
        return (this.getScenarioZone(player)?.amplificationIcons ?? 0) +
            this.getPlayersFor(player).reduce((total, zonePlayer) =>
                total + zonePlayer.amplificationIcons, 0);
    }
    hasCrisisFor(player) {
        return Boolean(this.getScenarioZone(player)?.hasCrisis) ||
            this.getPlayersFor(player).some(zonePlayer => zonePlayer.hasCrisis);
    }
    get match() {
        return this;
    }
    get minions() {
        let minions = [];

        this.players.forEach(player => {
            minions = minions.concat(player.minions);
        });

        return minions;
    }
    get numPlayers() {
        return this.players.length;
    }
    get objectToRefresh() {
        return 'match';
    }
    async refresh() {
        const isCurrentMatch = () =>
            typeof this.mc.getMatch !== 'function' ||
            this.mc.getMatch(this.name) === this;
        if (!isCurrentMatch()) {
            return;
        }

        const matchState = await this.toObjWithPlayableHands();
        if (!isCurrentMatch()) {
            return matchState;
        }

        this.mc.mcSocket.send(
            this.name,
            REFRESH_EVENTS[this.objectToRefresh],
            matchState
        );

        return matchState;
    }
    async finishGame(reason) {
        if (!reason) {
            throw new Error('Falta el motivo por el que ha terminado la partida.');
        }
        if (this.gameOverReason) {
            return;
        }

        this.playing = false;
        this.gameOverReason = reason;
        this.actionRequest = null;

        if (this.phase === 'players' && this.currentTurnPlayer) {
            this.mc.mcSocket.dispatch(
                this.name,
                EVENTS.TURN.END,
                {gameOver: true}
            );
        }

        await this.persist();
        await this.refresh();
    }
    get orderedPlayers() {
        const startIndex = this.players.indexOf(
            this.initialPlayer || this.currentPlayer
        );
        if (startIndex < 0) {
            return [];
        }

        return this.players.slice(startIndex).concat(
            this.players.slice(0, startIndex)
        );
    }
    get schemes() {
        return this.scenario.schemes;
    }
    get sideSchemes() {
        return this.scenario.sideSchemes;
    }
    get villain() {
        return path(this, 'scenario.villain');
    }
    addPlayer(player) {
        if (this.numPlayers < 4) {
            this.players.push(player);
        }
    }
    addScenario(scenario) {
        this.scenario = scenario;
    }
    createObligations() {
        const obligations = [];

        this.players.forEach(player => {
            player.superhero.obligations.forEach(card => {
                if (!card.owner) {
                    card.owner = player;
                }

                obligations.push(card);
            });
        });

        return obligations;
    }
    createPlayer({
        id,
        name,
        userId,
        superhero,
        initial = false,
        config = {}
    }) {
        const player = new Player({
            id,
            name,
            userId,
            superhero,
            initial,
            config,
            match: this
        });

        this.addPlayer(player);

        return player;
    }
    discardUntil(condition, removeFromDiscard = false, discardedCards) {
        return this.scenario.discardUntil(
            condition,
            removeFromDiscard,
            discardedCards
        );
    }
    drawEncounterCards(count = 1) {
        return this.scenario.drawEncounterCards(count);
    }
    drawInitial() {
        return this.promisesSequential(this.players, async player => {
            await player.superhero.initTriggers();

            return player.fillHand();
        });
    }
    getPlayer(player) {
        const playerById = this.players.find(_player => _player.id === player);
        if (playerById) {
            return playerById;
        }

        const playersByName = this.players.filter(_player =>
            _player.name === player || _player.userId === player
        );

        return playersByName.length === 1 ? playersByName[0] : undefined;
    }
    async selectInitialPlayer() {
        if (this.players.length < 2) {
            return this.initialPlayer;
        }

        if (!this.creatorUserId) {
            if (this.lobbyId) {
                throw new Error(
                    `No se encontró la cuenta creadora de la partida "${this.name}".`
                );
            }

            return this.initialPlayer;
        }

        const creator = this.players.find(player => player.userId === this.creatorUserId);
        if (!creator) {
            throw new Error(
                `No se encontró al creador de la partida "${this.name}" entre sus jugadores.`
            );
        }

        const {selected} = await this.openDialog({
            dialogType: DIALOG_LIST,
            targetPlayer: creator,
            targetPlayerName: creator.name,
            title: 'Elige al jugador inicial',
            subtitle: 'Selecciona quién comenzará la partida.',
            hideOk: true,
            data: {
                options: this.players.map(player => ({
                    text: `${player.name} - ${player.superhero.name}`,
                    image: player.superhero.image,
                    playerId: player.id,
                })),
            },
        });
        const initialPlayer = this.getPlayer(selected?.playerId);
        if (!initialPlayer) {
            throw new Error(
                'No se recibió un jugador válido para comenzar la partida.'
            );
        }

        this.players.forEach(player => {
            player.initial = player === initialPlayer;
        });

        return initialPlayer;
    }
    async initMatch(expert = false) {
        // Obligation
        const obligations = this.createObligations();
        // Nemesis
        this.initNemesis();
        // Shuffle Player decks
        this.initPlayers();
        await this.selectInitialPlayer();
        const player = this.initialPlayer;
        // Put Villain and Scheme &
        // Create Encounter Deck and Shuffle &
        // Put setup cards into play &
        // Resolve Setup Main Scheme
        await this.initScenario(obligations, expert);

        // Step 11: Setup cards in decks
        await this.resolveSetupDecks();

        // Resolve When reveal Main Scheme &
        // Resolve When reveal Villain
        await this.resolveWhenReveal(player);
        // Setup campaign
        this.setupCampaign();
        // Draw cards

        //this.players[0].deck.cards.sort(a => a.name === 'Intuición heróica' || a.name === 'Mockingbird' ? -1 : 0)
        //this.players[0].deck.cards.sort(a => a.name === 'Webbed Up' ? -1 : 0)
        //const card = this.players[0].deck.cards.find(a => a.resources.some(r => r === RESOURCE_WILD))
        //this.players[0].deck.cards.splice(6, 0, card);

        await this.drawInitial();
        // Mulligan
        await this.mulligan();

        // Step 16: Setup cards from hand or play
        await this.resolveSetupPlayer();

        // Resolve Setup Identity
        //this.scenario.deck.cards.sort(a => a.name === 'Shadow of the Past' ? -1 : 1)
        //this.scenario.deck.cards.sort(a => a.isMinion ? -1 : 1)
        this.initialized = true;
        this.startMatch().catch(error => {
            if (this.mc.getMatch(this.name) === this) {
                console.error(`Match "${this.name}" stopped unexpectedly`, error);
            }
        });
    }
    initNemesis() {
        return this.players.map(player => {
            return player.initNemesis();
        });
    }
    initPlayers() {
        let hasInitial = false;

        const players = this.players.map(player => {
            hasInitial = hasInitial || player.initial;

            return player.initPlayer();
        });

        if (!hasInitial) {
            this.players[0].initial = true;
        }

        return players;
    }
    async initScenario(obligations, expert = false) {
        await this.scenario.initScenario(obligations, expert);
    }
    isUniqueCard(card) {
        const zone = card.scenarioZone ??
            card.controller?.scenarioZone ??
            card.owner?.scenarioZone ??
            this.getScenarioZone();
        const zonePlayers = zone?.players ?? this.players;
        const cardsInPlay = [
            zone?.currentVillain,
            zone?.currentScheme,
            ...(zone?.cards ?? []),
            ...zonePlayers.flatMap(player => [
                player.superhero,
                ...player.gameZone.cards,
                ...player.gameZone.minions,
            ]),
        ].filter(Boolean);

        return cardsInPlay.some(other =>
            other !== card &&
            !(other.isVillain && card.isVillain) &&
            cardsShareUniqueIdentity(other, card));
    }
    listen(endpoint, callback, once) {
        this.mc.mcSocket.listen(this.name, endpoint, callback, once);
    }
    async mulligan() {
        const results = await Promise
            .all(this.players
                .map(player => player
                    .mulligan()));

        this.mc.mcSocket.send(
            this.name,
            EVENTS.MATCH.MULLIGAN_COMPLETE,
            {match: this.name},
        );

        return results;
    }
    openDialog(params) {
        const {mc} = this;

        return mc.dialog.openDialog(this, params);
    }
    removeCard(card) {
        this.removedCards.push(card);
    }
    removeCardFromEncountersDeck(card) {
        this.scenario.removeCardFromDeck(card);
    }
    persist() {
        return this.mc.persistMatch(this);
    }
    async resolveWhenReveal(player) {
        await this.getScenarioZone(player).resolveWhenReveal(player);
    }
    searchCard(condition, player) {
        let card = this.scenario.searchCard(condition, player);
        if (card) {
            return card;
        }

        this.getPlayersFor(player).find(zonePlayer => {
            card = zonePlayer.searchCard(condition);

            return card;
        });

        return card;
    }
    searchCards(condition, player) {
        const zones = player ?
            [this.getScenarioZone(player)] :
            this.scenario.zones;
        const cards = zones.flatMap(zone => zone.searchCards(condition));
        const zonePlayers = this.getPlayersFor(player);
        const cardsInPlayerZones = cards
            .concat(zonePlayers.reduce((ret, zonePlayer) =>
                ret.concat(zonePlayer.gameZone.searchCards(condition)),
                []));

        const minions = zonePlayers.flatMap(zonePlayer =>
            zonePlayer.minions ?? []);

        return cardsInPlayerZones.concat(minions.filter(minion =>
            !cardsInPlayerZones.includes(minion) &&
            checkCondition(minion, condition)));
    }
    startMatch() {
        this.playing = true;
        const playMatchEffect = new PlayMatchEffect({
            match: this,
        });

        return playMatchEffect.runEffect({});
    }
    async resolveSetupDecks() {
        await this.promisesSequential(this.players, async player => {
            const setupCards = player.deck.cards.filter(card => card.currentSide.abilities.some(a => a.isSetup));
            await this.promisesSequential(setupCards, async card => {
                player.deck.removeCardFromDeck(card);
                const putPlayEffect = new PutPlayEffect({
                    card,
                    controller: player,
                    match: this,
                });
                await putPlayEffect.runEffect({player, force: true});
                await card.setup({player});
            });
        });

        const scenarioSetupCards = this.scenario.deck.cards.filter(card => card.currentSide.abilities.some(a => a.isSetup));
        await this.promisesSequential(scenarioSetupCards, async card => {
            this.scenario.deck.removeCardFromDeck(card);
            const putPlayEffect = new PutPlayEffect({
                card,
                controller: this.scenario,
                match: this,
            });
            await putPlayEffect.runEffect({player: this.initialPlayer, force: true});
            await card.setup({player: this.initialPlayer});
        });
    }
    async resolveSetupPlayer() {
        await this.promisesSequential(this.players, async player => {
            await player.superhero.setup({player});

            const setupCards = player.gameZone.cards.filter(card => card.currentSide.abilities.some(a => a.isSetup));
            await this.promisesSequential(setupCards, async card => {
                await card.setup({player});
            });
        });
    }
    setupCampaign() {

    }
    toObj() {
        const {
            currentTurnPlayer,
            id,
            name,
            phase,
            playing,
            gameOverReason,
            players,
            scenario,
        } = this;

        return {
            ...super.toObj(),
            currentTurnPlayer: currentTurnPlayer?.id ??
                currentTurnPlayer?.userId ??
                currentTurnPlayer?.name ??
                null,
            id,
            name,
            ...(this.creatorUserId ? {creatorUserId: this.creatorUserId} : {}),
            phase,
            playing,
            gameOverReason,
            ...(this.actionRequest ? {actionRequest: {
                requester: this.actionRequest.requester,
                ...(this.actionRequest.requesterUserId ? {
                    requesterId: this.actionRequest.requesterId ??
                        this.actionRequest.requesterUserId,
                } : {}),
                target: this.actionRequest.target,
                ...(this.actionRequest.targetUserId ? {
                    targetId: this.actionRequest.targetId ??
                        this.actionRequest.targetUserId,
                } : {}),
                status: this.actionRequest.status,
            }} : {}),
            players: players.map(player => player.toObj()),
            scenario: scenario && scenario.toObj(),
        };
    }
    async toObjWithPlayableHands() {
        const players = await Promise.all(
            this.players.map(player => player.toObjWithPlayableHand())
        );
        const scenario = this.scenario &&
            await this.scenario.toObjWithAbilityAvailability(this.initialPlayer);

        return {
            ...this.toObj(),
            players,
            scenario,
        };
    }
}