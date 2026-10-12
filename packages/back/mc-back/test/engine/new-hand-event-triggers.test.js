import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    PRIORITY_RESPONSE,
    TRIGGER_END_PLAY_CARD,
    TARGET_TRIGGERED_CARD,
} from 'mc-shared';
import {ResponseAbility} from '../../src/abilities/response/response-ability.js';
import {AddHandEffect} from '../../src/effects/add-hand-effect.js';
import {PlayCardEffect} from '../../src/effects/play-card-effect.js';
import {ReturnHandEffect} from '../../src/effects/return-hand-effect.js';
import {Engine} from '../../src/engine/engine.js';
import {Hand} from '../../src/model/match/hand.js';

const createResponseAbility = ({match, name, onResolve = async () => {}}) => {
    const effect = {
        resolved: false,
        async canRun() {
            return true;
        },
        async runEffect(params) {
            this.resolved = false;
            await onResolve(params);
            this.resolved = true;
        },
    };

    return new ResponseAbility({
        effect,
        hideDialog: true,
        match,
        name,
        trigger: TRIGGER_END_PLAY_CARD,
    });
};

const createCard = ({id, isEvent, match, owner, onResolve}) => {
    const card = {
        abilities: [
            createResponseAbility({match, name: id, onResolve}),
        ],
        controller: owner,
        endTriggers() {
            this.triggers = {};
            delete match.triggerCards[this.id];
        },
        get currentSide() {
            return this;
        },
        id,
        initTriggers() {
            this.abilities.forEach(ability => ability.initTriggers(this));
        },
        isEvent,
        owner,
        triggers: {},
        async refresh() {},
    };

    card.abilities[0].card = card;

    return card;
};

const createMatchAndPlayer = () => {
    const match = {triggerCards: {}};
    const owner = {
        deck: {
            discardPile: [],
            async refresh() {},
            searchDiscard(card) {
                const index = this.discardPile.indexOf(card);
                if (index !== -1) {
                    this.discardPile.splice(index, 1);
                }
            },
        },
        match,
    };
    owner.hand = new Hand(owner);
    owner.hand.refresh = async () => {};
    owner.triggerEvent = async (trigger, params) => {
        const {ability, card} = trigger;

        owner.hand.discardHand(card);
        owner.deck.discardPile.push(card);
        await ability.resolveAbility({
            ...params,
            card,
            player: owner,
        });

        return {
            paymentCancelled: ability.paymentCancelled,
            triggered: ability.resolved,
        };
    };

    return {match, owner};
};

test('a response event returned to hand is a new option in the same trigger window', async () => {
    const {match, owner} = createMatchAndPlayer();
    let plays = 0;
    const event = createCard({
        id: 'returned-response',
        isEvent: true,
        match,
        onResolve: async () => {
            plays++;
            if (plays === 1) {
                const returnEffect = new ReturnHandEffect({
                    match,
                    selectedTarget: event,
                });
                await returnEffect.execute();
            }
        },
        owner,
    });
    owner.hand.addCard(event);

    const originalTrigger =
        event.triggers[TRIGGER_END_PLAY_CARD][PRIORITY_RESPONSE][0];
    const usedTriggers = [];
    const triggerEvent = owner.triggerEvent;
    owner.triggerEvent = async (...args) => {
        usedTriggers.push(args[0]);
        return triggerEvent(...args);
    };
    const engine = new Engine();
    engine.match = match;

    await engine.trigger(
        PRIORITY_RESPONSE,
        [TRIGGER_END_PLAY_CARD],
        {effect: {resolved: true}, player: owner}
    );

    assert.equal(plays, 2);
    assert.equal(usedTriggers[0], originalTrigger);
    assert.notEqual(usedTriggers[1], originalTrigger);
    assert.equal(usedTriggers[1].card, event);
    assert.equal(owner.hand.cards.includes(event), false);
});

test('a response returns the played event instead of the inherited context card', async () => {
    const {match, owner} = createMatchAndPlayer();
    const villain = {name: 'Rino'};
    const event = {
        endTriggers() {},
        id: 'attack-event',
        initTriggers() {},
        isEvent: true,
        isInPlay: false,
        isPlayerCard: true,
        owner,
        async refresh() {},
    };
    const returnEffect = new ReturnHandEffect({
        match,
        target: TARGET_TRIGGERED_CARD,
    });
    const morfogenetica = new ResponseAbility({
        effect: returnEffect,
        hideDialog: true,
        match,
        name: 'Morfogenética',
        trigger: TRIGGER_END_PLAY_CARD,
    });
    const hero = {
        abilities: [morfogenetica],
        id: 'ms-marvel',
        owner,
        triggers: {},
        get currentSide() {
            return this;
        },
    };
    morfogenetica.card = hero;
    morfogenetica.initTriggers(hero);
    owner.isHero = true;
    owner.isPlayer = true;
    owner.deck.discard = async card => {
        owner.deck.discardPile.push(card);
    };
    owner.match.isUniqueCard = () => false;
    owner.hand.addCard(event);

    const eventAbility = {
        paymentCancelled: false,
        async prepareToResolve() {
            return {canRun: true, preselectedTarget: false};
        },
        async resolveAbility() {},
    };
    const playEffect = new PlayCardEffect({
        ability: eventAbility,
        card: event,
        match,
    });
    playEffect.getCost = async () => 0;

    await playEffect.runEffect({
        card: villain,
        player: owner,
        triggeredCard: villain,
    });

    assert.deepEqual(owner.hand.cards, [event]);
    assert.deepEqual(owner.deck.discardPile, []);
});

test('a response event added to hand during a trigger window becomes available immediately', async () => {
    const {match, owner} = createMatchAndPlayer();
    let plays = 0;
    const drawnEvent = createCard({
        id: 'drawn-response',
        isEvent: true,
        match,
        onResolve: async () => {
            plays++;
        },
        owner,
    });
    const drawResponse = createCard({
        id: 'draw-response',
        isEvent: false,
        match,
        onResolve: async () => {
            const addHandEffect = new AddHandEffect({match});
            await addHandEffect.execute({
                cards: [drawnEvent],
                player: owner,
            });
        },
        owner,
    });
    drawResponse.abilities[0].initTriggers(drawResponse);

    const engine = new Engine();
    engine.match = match;

    await engine.trigger(
        PRIORITY_RESPONSE,
        [TRIGGER_END_PLAY_CARD],
        {effect: {resolved: true}, player: owner}
    );

    assert.equal(plays, 1);
    assert.equal(owner.hand.cards.includes(drawnEvent), false);
});
