import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    PRIORITY_INTERRUPT,
    TRAIT_AERIAL,
    TRAIT_AVENGER,
    TRIGGER_CHARACTER_WOULD_TAKE_DAMAGE,
} from 'mc-shared';
import aggressionUpgrades from '../../../mc-data/seed/catalog/aspects/aggression/upgrades.js';
import justiceUpgrades from '../../../mc-data/seed/catalog/aspects/justice/upgrades.js';
import protectionUpgrades from '../../../mc-data/seed/catalog/aspects/protection/upgrades.js';
import captainMarvel from '../../../mc-data/seed/catalog/heroes/captain-marvel.js';
import {CardsFactory} from '../../src/factory/cards/cards-factory.js';
import {Player} from '../../src/model/match/player.js';
import {CharacterGameCard} from '../../src/model/cards/character-game-card.js';

function createPlayer(match, name, superheroName = 'Capitana Marvel') {
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
        async canFlip() {
            return true;
        },
        toObj() {
            return {
                superhero: {
                    defense: this.superhero.defense,
                    extraTraits: [...this.superhero.extraTraits],
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
            name: superheroName,
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

test('Vuelo cósmico prevents damage only to the character named Capitana Marvel', async () => {
    const match = {
        activationsFactory: {
            createActivation: () => ({
                filterTarget: () => true,
                getTriggersParams: params => params,
                getTriggersWould: () => [],
                getTriggersInit: () => [],
                getTriggersEnds: () => [],
                getForcedResponseTriggers: () => [],
                checkStatus: () => true,
            }),
        },
        enemies: [],
        friends: [],
        triggerCards: {},
    };
    const peter = createPlayer(match, 'Peter Parker', 'Spider-Man');
    const carol = createPlayer(match, 'Carol Danvers');
    carol.superhero.sides = [
        {
            abilities: [],
            controller: carol,
            match,
            name: 'Carol Danvers',
            traits: [],
        },
        {
            abilities: [],
            controller: carol,
            match,
            name: 'Capitana Marvel',
            traits: [],
        },
    ];
    match.friends = [peter.superhero, carol.superhero];
    const cardsFactory = new CardsFactory({match});
    const flightCard = captainMarvel.config.cards.find(({card}) =>
        card.params.name === 'Vuelo cósmico').card;
    const gameCard = cardsFactory.createGameCard({
        card: cardsFactory.createCard(flightCard),
        owner: peter,
    });
    gameCard.controller = peter;
    await gameCard.initTriggers();

    const interrupt = gameCard.triggers[TRIGGER_CHARACTER_WOULD_TAKE_DAMAGE]
        [PRIORITY_INTERRUPT][0];
    carol.superhero.selectedSide = 0;
    const carolDanversDamage = {
        damage: 4,
        preventDamage: 0,
        selectedTarget: carol.superhero.currentSide,
        takenDamage: 4,
    };
    carol.superhero.selectedSide = 1;
    const carolDamage = {
        damage: 4,
        preventDamage: 0,
        selectedTarget: carol.superhero.currentSide,
        takenDamage: 4,
    };
    const peterDamage = {
        damage: 4,
        preventDamage: 0,
        selectedTarget: peter.superhero,
        takenDamage: 4,
    };
    const params = {player: peter};

    assert.equal(interrupt.getTarget({...params, effect: carolDamage}), carolDamage.selectedTarget);
    assert.equal(interrupt.getTarget({...params, effect: carolDanversDamage}), undefined);
    assert.equal(interrupt.getTarget({...params, effect: peterDamage}), undefined);

    const ability = gameCard.abilities.find(({trigger}) =>
        trigger === TRIGGER_CHARACTER_WOULD_TAKE_DAMAGE);
    await ability.effect.runEffect({
        ...interrupt.getAbilityParams({...params, effect: carolDamage}),
        player: peter,
    });

    assert.equal(carolDamage.preventDamage, 3);
    assert.equal(peterDamage.preventDamage, 0);
});

test('serializes attached upgrades with their ability availability for the hero controller', async () => {
    const player = createPlayer({
        triggerCards: {},
    }, 'Player 1');
    const serializedAttachment = {
        id: 'attached-upgrade',
        abilities: [{disable: true}],
    };
    player.superhero.attached.push({
        card: {attack: 0},
        async toObjWithAbilityAvailability(controller) {
            assert.equal(controller, player);

            return serializedAttachment;
        },
    });

    const result = await Player.prototype.toObjWithPlayableHand.call(player);

    assert.deepEqual(result.superhero.attached, [serializedAttachment]);
});

test('hides acquired traits that are printed on the active hero identity', async () => {
    const player = createPlayer({
        triggerCards: {},
    }, 'Player 1');
    player.superhero.sides = [
        {traits: [TRAIT_AVENGER], abilities: [], controller: player},
        {traits: [], abilities: [], controller: player},
    ];
    player.superhero.selectedSide = 0;
    player.superhero.extraTraits = [TRAIT_AVENGER];
    player.superhero.getEffectiveStats = async () => ({});
    player.superhero.getEffectiveTraits = async () =>
        player.superhero.currentSide.traits;

    const result = await Player.prototype.toObjWithPlayableHand.call(player);

    assert.deepEqual(result.superhero.extraTraits, []);
});

test('shows acquired traits not printed on the active alter-ego identity', async () => {
    const player = createPlayer({
        triggerCards: {},
    }, 'Player 1');
    player.superhero.sides = [
        {traits: [TRAIT_AVENGER], abilities: [], controller: player},
        {traits: [], abilities: [], controller: player},
    ];
    player.superhero.selectedSide = 1;
    player.superhero.extraTraits = [TRAIT_AVENGER];
    player.superhero.getEffectiveStats = async () => ({});
    player.superhero.getEffectiveTraits = async () =>
        player.superhero.currentSide.traits;

    const result = await Player.prototype.toObjWithPlayableHand.call(player);

    assert.deepEqual(result.superhero.extraTraits, [TRAIT_AVENGER]);
});

test('serializes traits granted during effective-trait calculation', async () => {
    const player = createPlayer({
        triggerCards: {},
    }, 'Player 1');
    player.superhero.sides = [
        {traits: [TRAIT_AVENGER], abilities: [], controller: player},
        {traits: [], abilities: [], controller: player},
    ];
    player.superhero.selectedSide = 1;
    player.superhero.getEffectiveStats = async () => ({});
    player.superhero.getEffectiveTraits = async () => {
        player.superhero.extraTraits.push(TRAIT_AVENGER);

        return player.superhero.currentSide.traits;
    };

    const result = await Player.prototype.toObjWithPlayableHand.call(player);

    assert.deepEqual(result.superhero.extraTraits, [TRAIT_AVENGER]);
});
