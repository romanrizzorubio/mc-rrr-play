import {CARD_TYPE_EVENT} from 'mc-shared';

import {CardsFactory} from '../src/factory/cards/cards-factory.js';
import {Deck} from '../src/model/match/deck.js';
import {loadCatalog} from '../../mc-data/seed/catalog.js';

const createPlayer = name => {
    const gameZone = {
        cards: [],
        minions: [],
        addToGameZone(card) {
            this.cards.push(card);
        },
        discard(card) {
            const index = this.cards.indexOf(card);
            if (index > -1) {
                this.cards.splice(index, 1);
            }
        },
        engage(minion) {
            this.minions.push(minion);
        },
        removeEngaged(minion) {
            const index = this.minions.indexOf(minion);
            if (index > -1) {
                this.minions.splice(index, 1);
            }
        },
        async refresh() {},
    };
    const player = {
        gameZone,
        hand: {cards: []},
        isPlayer: true,
        name,
        engage(minion) {
            this.gameZone.engage(minion);
        },
        removeEngaged(minion) {
            this.gameZone.removeEngaged(minion);
        },
        async refresh() {},
        get minions() {
            return this.gameZone.minions;
        },
    };
    const deck = new Deck({owner: player});

    deck.shuffle = () => {};
    deck.refresh = async () => {};
    deck.checkCycle = async function() {
        if (!this.cards.length) {
            this.cycle();
        }
    };
    player.deck = deck;

    return player;
};

export const createUltronTestContext = async ({playerCount = 1} = {}) => {
    const {scenarios} = await loadCatalog();
    const ultron = scenarios.find(({_id}) => _id === 'ultron');
    const players = Array.from({length: playerCount}, (_, index) =>
        createPlayer(`Player ${index + 1}`));
    const scenario = {
        deck: {
            cards: [],
            discardPile: [],
            isScenarioDeck: true,
            async discard(card) {
                this.discardPile.push(card);
            },
            async refresh() {},
        },
        gameZone: {
            cards: [],
            addToGameZone(card) {
                this.cards.push(card);
            },
            async discard(card) {
                const index = this.cards.indexOf(card);
                if (index > -1) {
                    this.cards.splice(index, 1);
                }
            },
        },
    };
    const match = {
        initialPlayer: players[0],
        players,
        scenario,
        triggerCards: {},
        async openDialog({data}) {
            const firstCard = data?.cards?.[0];

            return firstCard ? {selected: {id: firstCard.id}} : {};
        },
    };

    players.forEach(player => {
        player.match = match;
    });

    const cardsFactory = new CardsFactory({match});
    const environmentConfig = ultron.config.cards.find(({card}) =>
        card.params.name === 'Drones de Ultrón').card;
    const environment = cardsFactory.createGameCard({
        card: cardsFactory.createCard(environmentConfig),
        owner: scenario,
    });

    environment.controller = scenario;
    scenario.gameZone.addToGameZone(environment);
    await environment.initTriggers();

    return {
        cardsFactory,
        environment,
        match,
        players,
        scenario,
        ultron,
    };
};

export const addPlayerEvent = (cardsFactory, player, id, name = id) => {
    const card = cardsFactory.createCard({
        type: CARD_TYPE_EVENT,
        params: {
            id,
            cost: 1,
            image: `heroes/test/${id}.png`,
            name,
            set: 'test',
        },
    });
    const gameCard = cardsFactory.createGameCard({
        card,
        owner: player,
    });

    player.deck.cards.push(gameCard);

    return gameCard;
};
