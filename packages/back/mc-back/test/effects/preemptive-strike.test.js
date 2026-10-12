import assert from 'node:assert/strict';
import {test} from 'node:test';

import {DIALOG_USE_CARD} from 'mc-shared';
import {PlayCardEffect} from '../../src/effects/play-card-effect.js';
import {ResolveBoostEffect} from '../../src/effects/resolve-boost-effect.js';
import {CardsFactory} from '../../src/factory/cards/cards-factory.js';
import protectionEvents from '../../../mc-data/seed/catalog/aspects/protection/events.js';

const createScenario = async (
    boostCards,
    amplificationIcons = 2,
    confirmationResponses = []
) => {
    const preventedDamage = [];
    const player = {
        canDefend: () => true,
        isHero: true,
        isPlayer: true,
        hand: {
            cards: [],
            discardHand(card) {
                if (card.isEvent) {
                    card.endTriggers();
                }
                this.cards = this.cards.filter(heldCard => heldCard !== card);
            },
            addCard(card) {
                this.cards.push(card);
            },
            async refresh() {},
        },
        deck: {
            discardPile: [],
            async discard(card) {
                this.discardPile.push(card);
            },
        },
    };
    const villain = {
        abilities: [],
        id: 'villain',
        isVillain: true,
        name: 'Villain',
        toObj() {
            return {id: this.id, name: this.name};
        },
    };
    const enemyActivation = {
        boostCards,
        enemy: villain,
        isAttack: true,
    };
    const useCardDialogs = [];
    const confirmationDialogs = [];
    const playSteps = [];
    const match = {
        amplificationIcons,
        players: [player],
        triggerCards: {},
        villain,
        isUniqueCard: () => false,
        activationsFactory: {
            createActivation: () => ({
                canRun: async () => true,
                checkStatus: () => true,
                filterTarget: () => true,
                getTriggersEnds: () => [],
                getTriggersInit: () => [],
                getTriggersParams: params => params,
                getTriggersWould: () => [],
            }),
        },
        effectsFactory: {
            createEffect({damage}) {
                return {
                    takenDamage: damage,
                    async runEffect() {
                        preventedDamage.push(damage);
                    },
                };
            },
        },
        async openDialog({dialogType, data, title, subtitle}) {
            if (dialogType === 'confirm') {
                confirmationDialogs.push({title, subtitle, data});
                playSteps.push('confirmation');
                return confirmationResponses.length ?
                    confirmationResponses.shift() :
                    {confirmed: true};
            }
            if (dialogType === DIALOG_USE_CARD) {
                useCardDialogs.push(data.cards.map(card => card.id));
                return {selected: {id: data.cards[0].id}};
            }
        },
    };
    player.match = match;
    player.hand.getCard = id => player.hand.cards.find(card => card.id === id);
    player.triggerEvent = async (trigger, params) => {
        const playCardEffect = new PlayCardEffect({
            ability: trigger.ability,
            card: trigger.card,
            match,
        });
        playCardEffect.getCost = async () => {
            playSteps.push('payment');

            return 0;
        };
        await playCardEffect.runEffect(params);

        return {
            triggered: !playCardEffect.canceled,
            paymentCancelled: playCardEffect.paymentCancelled,
        };
    };

    const eventConfig = protectionEvents.find(({card}) =>
        card.params.name === 'Ataque preventivo').card;
    const cardsFactory = new CardsFactory({match});
    let strikeIndex = 0;
    const addPreemptiveStrike = async () => {
        const strike = cardsFactory.createGameCardFromConfig({
            ...eventConfig,
            params: {
                ...eventConfig.params,
                cost: 0,
            },
        }, {
            index: ++strikeIndex,
            owner: player,
        });
        player.hand.cards.push(strike);
        await strike.initTriggers();

        return strike;
    };
    const resolveBoost = async (cardIndex, previousBoost = 0) => {
        const boostEffect = new ResolveBoostEffect({
            card: boostCards[cardIndex],
            cardIndex,
            enemyActivation,
            match,
            previousBoost,
            selectedTarget: player,
        });
        await boostEffect.runEffect({player});

        return boostEffect;
    };

    return {
        addPreemptiveStrike,
        match,
        player,
        preventedDamage,
        resolveBoost,
        useCardDialogs,
        confirmationDialogs,
        playSteps,
    };
};

const makeBoostCard = (id, boost) => ({
    boost,
    id,
    image: `encounters/${id}.png`,
    name: `Carta ${id}`,
    toObj() {
        return {
            id: this.id,
            image: this.image,
            name: this.name,
        };
    },
});

test('one Ataque preventivo cancels only the boost card currently revealed', async () => {
    const boostCards = [
        makeBoostCard('boost-card-1', 3),
        makeBoostCard('boost-card-2', 2),
    ];
    const {
        addPreemptiveStrike,
        match,
        player,
        preventedDamage,
        resolveBoost,
        useCardDialogs,
        confirmationDialogs,
        playSteps,
    } = await createScenario(boostCards);
    const preemptiveStrike = await addPreemptiveStrike();

    const firstBoost = await resolveBoost(0);
    assert.deepEqual(player.deck.discardPile, [preemptiveStrike]);
    assert.deepEqual(player.hand.cards, []);
    assert.equal(match.triggerCards[preemptiveStrike.id], undefined);
    const secondBoost = await resolveBoost(1, firstBoost.value);

    assert.equal(firstBoost.value, 0);
    assert.equal(firstBoost.cancelledBoostIcons, 5);
    assert.equal(secondBoost.value, 4);
    assert.equal(secondBoost.cancelledBoostIcons, 0);
    assert.deepEqual(preventedDamage, [5]);
    assert.deepEqual(player.deck.discardPile, [preemptiveStrike]);
    assert.deepEqual(player.hand.cards, []);
    assert.equal(useCardDialogs.length, 1);
    assert.equal(confirmationDialogs[0].title, 'Ataque preventivo');
    assert.equal(confirmationDialogs[0].subtitle, undefined);
    assert.equal(confirmationDialogs[0].data.boostIconCount, 5);
    assert.equal(confirmationDialogs[0].data.boostIconLabel, undefined);
    assert.equal(
        confirmationDialogs[0].data.card.image,
        'encounters/boost-card-1.png'
    );
    assert.equal(confirmationDialogs[0].data.card.name, 'Carta boost-card-1');
    assert.equal(confirmationDialogs[0].data.horizontal, false);
    assert.deepEqual(playSteps, ['confirmation', 'payment']);
});

test('two Ataque preventivo copies can cancel two separate boost cards', async () => {
    const boostCards = [
        makeBoostCard('boost-card-1', 3),
        makeBoostCard('boost-card-2', 2),
    ];
    const {
        addPreemptiveStrike,
        player,
        preventedDamage,
        resolveBoost,
        useCardDialogs,
    } = await createScenario(boostCards);
    const firstStrike = await addPreemptiveStrike();
    const secondStrike = await addPreemptiveStrike();

    const firstBoost = await resolveBoost(0);
    assert.deepEqual(player.hand.cards, [secondStrike]);
    const secondBoost = await resolveBoost(1, firstBoost.value);

    assert.equal(firstBoost.value, 0);
    assert.equal(secondBoost.value, 0);
    assert.deepEqual(preventedDamage, [5, 4]);
    assert.deepEqual(player.deck.discardPile, [firstStrike, secondStrike]);
    assert.deepEqual(player.hand.cards, []);
    assert.equal(useCardDialogs.length, 2);
});

test('a second Ataque preventivo cannot trigger after the boost icons are canceled', async () => {
    const {
        addPreemptiveStrike,
        player,
        preventedDamage,
        resolveBoost,
        useCardDialogs,
    } = await createScenario([makeBoostCard('boost-card', 3)]);
    const firstStrike = await addPreemptiveStrike();
    const secondStrike = await addPreemptiveStrike();

    const boost = await resolveBoost(0);

    assert.equal(useCardDialogs.length, 1);
    assert.equal(boost.value, 0);
    assert.equal(boost.cancelledBoostIcons, 5);
    assert.deepEqual(preventedDamage, [5]);
    assert.deepEqual(player.deck.discardPile, [firstStrike]);
    assert.deepEqual(player.hand.cards, [secondStrike]);
});

test('Ataque preventivo cancels an amplification-generated icon on a card without printed icons', async () => {
    const {
        addPreemptiveStrike,
        player,
        preventedDamage,
        resolveBoost,
        useCardDialogs,
    } = await createScenario(
        [makeBoostCard('amplification-only-boost-card', 0)],
        1
    );
    const preemptiveStrike = await addPreemptiveStrike();

    const boost = await resolveBoost(0);

    assert.equal(useCardDialogs.length, 1);
    assert.equal(boost.value, 0);
    assert.equal(boost.cancelledBoostIcons, 1);
    assert.deepEqual(preventedDamage, [1]);
    assert.deepEqual(player.deck.discardPile, [preemptiveStrike]);
    assert.deepEqual(player.hand.cards, []);
});

test('Ataque preventivo is unavailable when a boost card has no printed or amplified icons', async () => {
    const {
        addPreemptiveStrike,
        player,
        preventedDamage,
        resolveBoost,
        useCardDialogs,
    } = await createScenario([makeBoostCard('boost-card-without-icons', 0)], 0);
    const preemptiveStrike = await addPreemptiveStrike();

    const boost = await resolveBoost(0);

    assert.deepEqual(useCardDialogs, []);
    assert.equal(boost.value, 0);
    assert.equal(boost.cancelledBoostIcons, 0);
    assert.deepEqual(preventedDamage, []);
    assert.deepEqual(player.hand.cards, [preemptiveStrike]);
});

test('declining confirmation keeps the card available to retry without paying', async () => {
    const {
        addPreemptiveStrike,
        player,
        preventedDamage,
        resolveBoost,
        useCardDialogs,
        confirmationDialogs,
        playSteps,
    } = await createScenario(
        [makeBoostCard('boost-card', 3)],
        2,
        [null, {confirmed: true}]
    );
    const declinedStrike = await addPreemptiveStrike();
    const acceptedStrike = await addPreemptiveStrike();

    const boost = await resolveBoost(0);

    assert.equal(confirmationDialogs.length, 2);
    assert.equal(useCardDialogs.length, 2);
    assert.ok(useCardDialogs[1].includes(declinedStrike.id));
    assert.ok(useCardDialogs[1].includes(acceptedStrike.id));
    assert.deepEqual(player.hand.cards, [acceptedStrike]);
    assert.deepEqual(player.deck.discardPile, [declinedStrike]);
    assert.deepEqual(playSteps, [
        'confirmation',
        'confirmation',
        'payment',
    ]);
    assert.equal(boost.value, 0);
    assert.equal(boost.cancelledBoostIcons, 5);
    assert.deepEqual(preventedDamage, [5]);
});
