import {REFRESH_EVENTS} from 'mc-endpoints';
import {PlayMatchEffect} from '../../effects/play-match-effect.js';
import {Engine} from '../../engine/engine.js';
import {path} from '../../engine/utils.js';

import {Player} from './player.js';
import {PutPlayEffect} from '../../effects/put-play-effect.js';

export class Match extends Engine {
    constructor({
        mc,
        name,
    }) {
        super(arguments[0]);

        this.mc = mc;
        this.name = name;

        this.villains = [];
        this.players = [];
        this.removedCards = [];
        this.scenario = null;
        this.playing = false;

        this.lasting = [];
        this.limits = {};
        this.triggerCards = {};
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
    get mainScheme() {
        return path(this, 'scenario.mainScheme');
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
        this.mc.mcSocket.send(
            REFRESH_EVENTS[this.objectToRefresh],
            await this.toObjWithPlayableHands()
        );
    }
    get orderedPlayers() {
        const players = [];
        let i = this.players.indexOf(this.currentPlayer);
        let player = this.players[i];
        while (player) {
            players.push(player);

            player = this.players[++i];
            if (!player) {
                i = 0;
                player = this.players[i];
            }
            if (player.initial) {
                break;
            }
        }

        return players;
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
        name,
        superhero,
        initial = false,
        config = {}
    }) {
        const player = new Player({
            name,
            superhero,
            initial,
            config,
            match: this
        });

        this.addPlayer(player);

        return player;
    }
    discardUntil(condition, removeFromDiscard = false) {
        return this.scenario.discardUntil(condition, removeFromDiscard);
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
        return this.players.find(_player => _player.name === player);
    }
    async initMatch(expert = false) {
        // Select first player
        const player = this.initialPlayer;
        // Obligation
        const obligations = this.createObligations();
        // Nemesis
        this.initNemesis();
        // Shuffle Player decks
        this.initPlayers();
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
        this.startMatch();
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
        const searched = this.searchCard({
            name: card.name,
        });

        if (searched) {
            if (searched.isVillain && card.isVillain) {
                return false;
            }
            return searched.unique && card.unique;
        }

        return false;
    }
    listen(endpoint, callback, once) {
        this.mc.mcSocket.listen(endpoint, callback, once);
    }
    mulligan() {
        return Promise
            .all(this.players
                .map(player => player
                    .mulligan()));
    }
    openDialog(params) {
        const {mc} = this;

        return mc.dialog.openDialog(params);
    }
    removeCard(card) {
        this.removedCards.push(card);
    }
    removeCardFromEncountersDeck(card) {
        this.scenario.removeCardFromDeck(card);
    }
    async resolveWhenReveal(player) {
        await this.scenario.gameZone.resolveWhenReveal(player);
    }
    searchCard(condition) {
        let card = this.scenario.searchCard(condition);
        if (card) {
            return card;
        }

        this.players.find(player => {
            card = player.searchCard(condition);

            return card;
        });

        return card;
    }
    searchCards(condition) {
        const cards = this.scenario.gameZone.searchCards(condition);

        return cards
            .concat(this.players.reduce((ret, player) =>
                ret.concat(player.gameZone.searchCards(condition)),
                []));
    }
    startMatch() {
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
            name,
            playing,
            players,
            scenario,
        } = this;

        return {
            ...super.toObj(),
            name,
            playing,
            players: players.map(player => player.toObj()),
            scenario: scenario && scenario.toObj(),
        };
    }
    async toObjWithPlayableHands() {
        return {
            ...this.toObj(),
            players: await Promise.all(
                this.players.map(player => player.toObjWithPlayableHand())
            ),
        };
    }
}