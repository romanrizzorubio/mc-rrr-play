import assert from 'node:assert/strict';
import {test} from 'node:test';

import aggressionUpgrades from '../../../mc-data/seed/catalog/aspects/aggression/upgrades.js';
import justiceUpgrades from '../../../mc-data/seed/catalog/aspects/justice/upgrades.js';
import protectionUpgrades from '../../../mc-data/seed/catalog/aspects/protection/upgrades.js';
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
            thwart: 1,
        },
        sides: [],
        abilities: [],
        attached: [],
        damage: 0,
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
