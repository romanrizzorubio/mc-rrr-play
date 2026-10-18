import assert from 'node:assert/strict';
import {test} from 'node:test';

import {RESOURCE_ENERGY} from 'mc-shared';
import {ActivationsFactory} from '../../src/factory/activations/activations-factory.js';
import {CardsFactory} from '../../src/factory/cards/cards-factory.js';
import {Hand} from '../../src/model/match/hand.js';
import {Player} from '../../src/model/match/player.js';
import captainMarvel from '../../../mc-data/seed/catalog/heroes/captain-marvel.js';

test('a labeled ability resolves after discarding its source card as a cost', async () => {
    const enemy = {
        abilities: [],
        damage: 0,
        hitPoints: 10,
        id: 'test-enemy',
        isEnemy: true,
        isMinion: true,
        name: 'Test enemy',
        async getLife() {
            return this.hitPoints - this.damage;
        },
        canBeAttacked() {
            return true;
        },
        placeDamage(damage) {
            this.damage += damage;
        },
        async refresh() {},
    };
    const player = {
        isHero: true,
        isPlayer: true,
        isStunned: false,
        canAttack() {
            return true;
        },
        gameZone: {
            discard() {},
            async refresh() {},
        },
        deck: {
            async discard() {},
            async refresh() {},
        },
    };
    const match = {
        enemies: [enemy],
        triggerCards: {},
    };
    match.activationsFactory = new ActivationsFactory(match);
    const cardsFactory = new CardsFactory({match});
    match.effectsFactory = cardsFactory.abilitiesFactory.effectsFactory;

    const channelEnergyConfig = captainMarvel.config.cards.find(({card}) =>
        card.params.name === 'Canalizar energía').card;
    const printedCard = cardsFactory.createCard(channelEnergyConfig);
    const channelEnergy = cardsFactory.createGameCard({
        card: printedCard,
        index: 1,
        owner: player,
    });
    channelEnergy.controller = player;
    channelEnergy.counters = 2;

    const shootAbility = channelEnergy.abilities.find(({name}) =>
        name === 'Disparar');
    const serializedChannelEnergy =
        await channelEnergy.toObjWithAbilityAvailability(player);
    const serializedShootAbility = serializedChannelEnergy.abilities.find(
        ({name}) => name === 'Disparar'
    );

    assert.deepEqual(serializedShootAbility.availableTargetIds, ['test-enemy']);

    player.match = match;
    player.superhero = {
        isHero: true,
        isSuperhero: true,
    };
    player.getCard = cardId => cardId === channelEnergy.id ?
        channelEnergy :
        undefined;
    match.scenario = {
        getCard() {
            return undefined;
        },
    };
    Object.setPrototypeOf(player, Player.prototype);

    await player.resolveAbility(
        channelEnergy.id,
        channelEnergy.abilities.indexOf(shootAbility),
        enemy.id
    );

    assert.equal(channelEnergy.controller, undefined);
    assert.equal(shootAbility.resolved, true);
    assert.equal(shootAbility.character, undefined);
    assert.equal(enemy.damage, 4);
});

test('Cargar pays a dragged resource without opening the payment dialog', async () => {
    let dialogOpened = false;
    const resourceCard = {
        card: {
            getResources: () => [RESOURCE_ENERGY],
        },
        id: 'energy-card',
        isPlaying: false,
    };
    const hand = Object.create(Hand.prototype);
    hand.cards = [resourceCard];
    hand.getCard = cardId => hand.cards.find(card => card.id === cardId);
    const player = Object.create(Player.prototype);
    player.isPlayer = true;
    player.hand = hand;
    hand.owner = player;
    player.deck = {
        async discard() {},
        async refresh() {},
    };
    player.superhero = {
        currentSide: {
            id: 'hero-side',
            async hasResourceGenerators() {
                return false;
            },
        },
        isHero: true,
        isSuperhero: true,
    };
    player.gameZone = {
        cards: [],
        getCard() {
            return undefined;
        },
    };

    const match = {
        enemies: [],
        mc: {
            mcSocket: {
                send() {},
            },
        },
        async openDialog() {
            dialogOpened = true;
            throw new Error('No payment dialog should be opened.');
        },
        triggerCards: {},
    };
    match.activationsFactory = new ActivationsFactory(match);
    const cardsFactory = new CardsFactory({match});
    match.effectsFactory = cardsFactory.abilitiesFactory.effectsFactory;
    const channelEnergyConfig = captainMarvel.config.cards.find(({card}) =>
        card.params.name === 'Canalizar energía').card;
    const channelEnergy = cardsFactory.createGameCard({
        card: cardsFactory.createCard(channelEnergyConfig),
        index: 1,
        owner: player,
    });
    channelEnergy.controller = player;
    player.gameZone.cards.push(channelEnergy);
    player.getCard = cardId => cardId === channelEnergy.id ?
        channelEnergy :
        undefined;
    player.superhero.match = match;
    match.scenario = {
        getCard() {
            return undefined;
        },
    };
    const serializedChannelEnergy =
        await channelEnergy.toObjWithAbilityAvailability(player);
    const serializedChargeAbility = serializedChannelEnergy.abilities.find(
        ({name}) => name === 'Cargar'
    );

    assert.deepEqual(serializedChargeAbility.resourcePayment, {
        resourceType: RESOURCE_ENERGY,
        sourceIds: [resourceCard.id],
    });

    await player.resolveAbility(
        channelEnergy.id,
        0,
        undefined,
        {
            cardId: resourceCard.id,
            source: 'hand',
        }
    );

    assert.equal(dialogOpened, false);
    assert.equal(channelEnergy.counters, 1);
    assert.equal(hand.cards.includes(resourceCard), false);
});
