import assert from 'node:assert/strict';
import {test} from 'node:test';

import {TRAIT_AERIAL} from 'mc-shared';
import aggressionUpgrades from '../../../mc-data/seed/catalog/aspects/aggression/upgrades.js';
import justiceUpgrades from '../../../mc-data/seed/catalog/aspects/justice/upgrades.js';
import protectionUpgrades from '../../../mc-data/seed/catalog/aspects/protection/upgrades.js';
import captainMarvel from '../../../mc-data/seed/catalog/heroes/captain-marvel.js';
import {CardsFactory} from '../../src/factory/cards/cards-factory.js';
import {Player} from '../../src/model/match/player.js';
import {CharacterGameCard} from '../../src/model/cards/character-game-card.js';

function createPlayer(match, name) {
    const player = {
        name,
        isHero: true,
        hand: {
            toObjWithPlayability: async () => [],
        },
        async getHandSize() {
            return 0;
        },
        async getHitPoints() {
            return 12;
        },
        toObj() {
            return {
                superhero: {
                    defense: this.superhero.defense,
                    extraTraits: this.superhero.extraTraits,
                },
            };
        },
    };
    const superhero = Object.create(CharacterGameCard.prototype);

    Object.assign(superhero, {
        card: {
            attack: 1,
            defense: 2,
            match,
            name: 'Capitana Marvel',
            thwart: 1,
            traits: [],
        },
        sides: [],
        abilities: [],
        attached: [],
        damage: 0,
        extraTraits: [],
        modifyAttack: 0,
        modifyThwart: 0,
        modifyHitPoints: 0,
        _controller: player,
    });
    player.superhero = superhero;

    return player;
}

test('Hero attack, thwart, and defense stats include only their controller modifiers', async () => {
    const match = {
        triggerCards: {},
    };
    const player = createPlayer(match, 'Player 1');
    const cardsFactory = new CardsFactory({match});
    const upgrades = [
        aggressionUpgrades[0],
        protectionUpgrades[0],
        justiceUpgrades[0],
    ];
    for (const upgrade of upgrades) {
        const card = cardsFactory.createCard(upgrade.card);
        const gameCard = cardsFactory.createGameCard({card, owner: player});
        gameCard.controller = player;
        await gameCard.initTriggers();
    }

    const result = await Player.prototype.toObjWithPlayableHand.call(player);
    assert.deepEqual({
        attack: result.superhero.attack,
        thwart: result.superhero.thwart,
        defense: result.superhero.defense,
    }, {
        attack: 2,
        thwart: 2,
        defense: 3,
    });

    const otherPlayer = createPlayer(match, 'Player 2');
    const otherStats = await otherPlayer.superhero.getEffectiveStats();
    assert.deepEqual({
        attack: otherStats.attack,
        thwart: otherStats.thwart,
        defense: otherStats.defense,
    }, {
        attack: 1,
        thwart: 1,
        defense: 2,
    });
});

test('Vuelo cósmico shows its acquired Aerial trait on the hero identity', async () => {
    const match = {
        triggerCards: {},
    };
    const player = createPlayer(match, 'Carol Danvers');
    const cardsFactory = new CardsFactory({match});
    const flightCard = captainMarvel.config.cards.find(({card}) =>
        card.params.name === 'Vuelo cósmico').card;
    const gameCard = cardsFactory.createGameCard({
        card: cardsFactory.createCard(flightCard),
        owner: player,
    });
    gameCard.controller = player;
    await gameCard.initTriggers();

    const result = await Player.prototype.toObjWithPlayableHand.call(player);

    assert.deepEqual(result.superhero.extraTraits, [TRAIT_AERIAL]);
});
