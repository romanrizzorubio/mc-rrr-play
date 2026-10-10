import assert from 'node:assert/strict';
import {test} from 'node:test';

import {CARD_TYPE_ALLY, TRAIT_AVENGER} from 'mc-shared';
import leadershipAllies from '../../../mc-data/seed/catalog/aspects/leadership/allies.js';
import leadershipSupports from '../../../mc-data/seed/catalog/aspects/leadership/supports.js';
import {CardsFactory} from '../../src/factory/cards/cards-factory.js';
import {cardsShareUniqueIdentity} from '../../src/utils/unique-card-utils.js';

const quinjetConfig = leadershipSupports.find(({_id}) =>
    _id === 'leadership-quinjet').card;

const createAlly = (id, cost, traits = [TRAIT_AVENGER]) => ({
    id,
    name: id,
    type: CARD_TYPE_ALLY,
    cost,
    traits,
    async canPlay() {
        return true;
    },
    toObj() {
        return {
            id: this.id,
            name: this.name,
            type: this.type,
            cost: this.cost,
            traits: this.traits,
        };
    },
});

const createFixture = ({handCards = [], openDialog} = {}) => {
    const gameZoneCards = [];
    const player = {
        hand: {
            cards: handCards,
            discardHand(card) {
                const index = this.cards.indexOf(card);
                if (index > -1) {
                    this.cards.splice(index, 1);
                }
            },
            async refresh() {},
        },
        gameZone: {
            cards: gameZoneCards,
            addToGameZone(card) {
                gameZoneCards.push(card);
            },
            async refresh() {},
        },
        deck: {async refresh() {}},
        get allies() {
            return gameZoneCards.filter(card => card.isAlly);
        },
    };
    const match = {
        triggerCards: {},
        openDialog,
        isUniqueCard(card) {
            return gameZoneCards.some(inPlayCard =>
                inPlayCard !== card &&
                cardsShareUniqueIdentity(inPlayCard, card));
        },
    };
    const cardsFactory = new CardsFactory({match});
    const quinjet = cardsFactory.createGameCard({
        card: cardsFactory.createCard(quinjetConfig),
        owner: player,
    });
    const ability = quinjet.abilities.find(({name}) =>
        name === 'Poner en juego un Aliado Vengador');

    quinjet.controller = player;
    quinjet.counters = 1;

    return {ability, cardsFactory, match, player, quinjet};
};

test('Quinjet only enables and offers Avengers whose cost is within its counters', async () => {
    const affordableAlly = createAlly('Affordable Avenger', 1);
    const expensiveAlly = createAlly('Expensive Avenger', 2);
    const nonAvenger = createAlly('Other ally', 1, []);
    const {ability, player, quinjet} = createFixture({
        handCards: [affordableAlly, expensiveAlly, nonAvenger],
    });
    const [searchEffect] = ability.effect.effects;

    assert.equal(await ability.canRun({player, card: quinjet}), true);
    assert.deepEqual(
        await searchEffect.getOptions({player, card: quinjet}),
        [affordableAlly]
    );

    player.hand.cards = [expensiveAlly, nonAvenger];
    assert.equal(await ability.canRun({player, card: quinjet}), false);

    quinjet.counters = 2;
    assert.equal(await ability.canRun({player, card: quinjet}), true);
    assert.deepEqual(
        await searchEffect.getOptions({player, card: quinjet}),
        [expensiveAlly]
    );
});

test('Quinjet without a counter only allows zero-cost Avengers', async () => {
    const freeAvenger = createAlly('Free Avenger', 0);
    const costOneAvenger = createAlly('Cost-one Avenger', 1);
    const {ability, player, quinjet} = createFixture({
        handCards: [costOneAvenger],
    });
    const [searchEffect] = ability.effect.effects;

    quinjet.counters = undefined;
    assert.equal(await ability.canRun({player, card: quinjet}), false);

    player.hand.cards = [freeAvenger, costOneAvenger];
    assert.equal(await ability.canRun({player, card: quinjet}), true);
    assert.deepEqual(
        await searchEffect.getOptions({player, card: quinjet}),
        [freeAvenger]
    );
});

test('Quinjet disables its ability for a real cost-two Avenger with no counters', async () => {
    const allyConfig = leadershipAllies.find(({_id}) =>
        _id === 'leadership-squirrel-girl').card;
    const {ability, cardsFactory, player, quinjet} = createFixture();
    const ally = cardsFactory.createGameCard({
        card: cardsFactory.createCard(allyConfig),
        owner: player,
    });

    player.hand.cards = [ally];
    quinjet.counters = undefined;

    assert.equal(ally.cost, 2);
    assert.equal(await ability.canRun({player, card: quinjet}), false);
    const serializedQuinjet = await quinjet.toObjWithAbilityAvailability(player);
    const serializedAbility = serializedQuinjet.abilities.find(({name}) =>
        name === ability.name);

    assert.equal(serializedAbility.disable, true);
});

test('Quinjet moves the selected ally out of hand when putting it into play', async () => {
    const ally = createAlly('Affordable Avenger', 1);
    const {ability, player, quinjet} = createFixture({
        openDialog: async dialog => ({
            selected: [{id: dialog.data.cards[0].id}],
        }),
    });
    ally.owner = player;
    ally.isPlayerCard = true;
    ally.isAlly = true;
    ally.isInPlay = false;
    ally.initTriggers = async () => {};
    player.hand.cards.push(ally);
    quinjet.counters = 1;
    quinjet.discard = async () => {};

    await ability.resolveAbility({card: quinjet, player});

    assert.equal(player.gameZone.cards.includes(ally), true);
    assert.equal(player.hand.cards.includes(ally), false);
});

test('Quinjet excludes a unique Avenger already in play and rechecks it before placement', async () => {
    const allyConfig = leadershipAllies.find(({_id}) =>
        _id === 'leadership-ojo-de-halcon').card;
    const {ability, cardsFactory, player, quinjet} = createFixture();
    const createHawkeye = () => cardsFactory.createGameCard({
        card: cardsFactory.createCard(allyConfig),
        owner: player,
    });
    const hawkeyeInPlay = createHawkeye();
    const duplicateHawkeye = createHawkeye();
    const [searchEffect, putPlayEffect] = ability.effect.effects;

    player.gameZone.cards.push(hawkeyeInPlay);
    player.hand.cards = [duplicateHawkeye];
    quinjet.counters = 3;

    assert.equal(await duplicateHawkeye.canPlay({player, checkOnly: true}), false);
    assert.deepEqual(
        await searchEffect.getOptions({player, card: quinjet}),
        []
    );
    assert.equal(await ability.canRun({player, card: quinjet}), false);

    putPlayEffect.selectedTarget = player;
    assert.equal(await putPlayEffect.canRun({
        player,
        selectedCard: duplicateHawkeye,
    }), false);

    await putPlayEffect.execute({
        player,
        selectedCard: duplicateHawkeye,
    });
    assert.equal(putPlayEffect.isResolved(), false);
    assert.equal(putPlayEffect.isFullResolved(), false);
    assert.deepEqual(putPlayEffect.getTriggersEnds({
        selectedCard: duplicateHawkeye,
    }), []);
    assert.deepEqual(player.gameZone.cards, [hawkeyeInPlay]);
});

test('Quinjet permits an Avenger at the ally limit so the excess ally can be discarded', async () => {
    const allyConfig = leadershipAllies.find(({_id}) =>
        _id === 'leadership-squirrel-girl').card;
    const {ability, cardsFactory, player, quinjet} = createFixture();
    const ally = cardsFactory.createGameCard({
        card: cardsFactory.createCard(allyConfig),
        owner: player,
    });
    const [searchEffect] = ability.effect.effects;

    player.gameZone.cards.push(
        {id: 'ally-1', isAlly: true},
        {id: 'ally-2', isAlly: true},
        {id: 'ally-3', isAlly: true},
    );
    player.hand.cards = [ally];
    quinjet.counters = 2;

    assert.equal(await ally.canPlay({player, checkOnly: true}), true);
    assert.deepEqual(
        await searchEffect.getOptions({player, card: quinjet}),
        [ally]
    );
});

test('Quinjet does not put an ally into play if it becomes unplayable during selection', async () => {
    const allyConfig = leadershipAllies.find(({_id}) =>
        _id === 'leadership-ojo-de-halcon').card;
    const {ability, cardsFactory, match, player, quinjet} = createFixture();
    const createHawkeye = () => cardsFactory.createGameCard({
        card: cardsFactory.createCard(allyConfig),
        owner: player,
    });
    const hawkeye = createHawkeye();
    let quinjetDiscarded = false;

    player.hand.cards = [hawkeye];
    quinjet.counters = 3;
    quinjet.discard = async () => {
        quinjetDiscarded = true;
    };
    match.openDialog = async dialog => {
        player.gameZone.cards.push(createHawkeye());
        return {
            selected: [{id: dialog.data.cards[0].id}],
        };
    };

    await ability.resolveAbility({card: quinjet, player});

    assert.equal(player.gameZone.cards.includes(hawkeye), false);
    assert.equal(quinjetDiscarded, false);
});

test('cancelling Quinjet selection stops its effect and does not discard Quinjet', async () => {
    const dialogs = [];
    const ally = createAlly('Affordable Avenger', 1);
    const expensiveAlly = createAlly('Expensive Avenger', 2);
    const nonAvenger = createAlly('Other ally', 1, []);
    const {ability, player, quinjet} = createFixture({
        handCards: [ally, expensiveAlly, nonAvenger],
        openDialog: async dialog => {
            dialogs.push(dialog);
            return undefined;
        },
    });
    let discarded = false;
    quinjet.discard = async () => {
        discarded = true;
    };

    await ability.resolveAbility({card: quinjet, player});

    assert.equal(dialogs.length, 1);
    assert.equal(dialogs[0].showCancel, true);
    assert.deepEqual(dialogs[0].data.cards.map(({id}) => id), [ally.id]);
    assert.equal(ability.paymentCancelled, true);
    assert.equal(discarded, false);
});
