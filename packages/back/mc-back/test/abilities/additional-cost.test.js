import assert from 'node:assert/strict';
import test from 'node:test';

import {DIALOG_DISCARD_HAND} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {AttackBasicAbility} from '../../src/abilities/basic/attack-basic-ability.js';
import {ExhaustEffect} from '../../src/effects/exhaust-effect.js';
import {SelectDiscardCardEffect} from '../../src/effects/select-discard-card-effect.js';
import {SimultaneousEffect} from '../../src/effects/simultaneous-effect.js';
import {PlayCardEffect} from '../../src/effects/play-card-effect.js';
import {MatchFactory} from '../../src/factory/match-factory.js';

test('Wonder Man adds a discard cost to his basic attack, not his play cost', async () => {
    const catalog = await loadCatalog();
    const wonderMan = catalog.aspects.find(({_id}) =>
        _id === 'leadership-wonder-man');
    assert.ok(wonderMan);
    const discarded = [];
    const discardableCard = {
        id: 'discardable-card',
        toObj() {
            return {id: this.id};
        },
    };
    const player = {
        hand: {
            cards: [],
            async refresh() {},
            async discardHand(card) {
                this.cards.splice(this.cards.indexOf(card), 1);
            },
        },
        isPlayer: true,
        gameZone: {
            async refresh() {},
        },
        deck: {
            async discard(card) {
                discarded.push(card);
            },
            refresh() {},
        },
    };
    let confirmDiscard = false;
    const matchFactory = new MatchFactory({
        triggerCards: {},
    });
    matchFactory.match.openDialog = async ({dialogType, data, showCancel}) => {
        assert.equal(dialogType, DIALOG_DISCARD_HAND);
        assert.equal(showCancel, true);

        return confirmDiscard ?
            {selected: [{id: data.cards[0].id}]} :
            undefined;
    };
    const printedCard = matchFactory.cardsFactory.createCard(wonderMan.card);
    const gameCard = matchFactory.cardsFactory.createGameCard({
        card: printedCard,
        owner: player,
    });
    gameCard.controller = player;
    gameCard.refresh = async () => {};

    const attack = gameCard.abilities.find(ability =>
        ability instanceof AttackBasicAbility);
    assert.ok(attack);
    assert.ok(attack.arrow.cost instanceof ExhaustEffect);

    const params = {
        ability: attack,
        card: gameCard,
        match: matchFactory.match,
        player,
    };
    assert.equal(await attack.arrow.getCost(params), attack.arrow.cost);

    const playCardEffect = new PlayCardEffect({
        card: gameCard,
        match: matchFactory.match,
    });
    assert.equal(await playCardEffect.getCost(params), 2);

    await gameCard.initTriggers();
    const cost = await attack.arrow.getCost(params);

    assert.ok(cost instanceof SimultaneousEffect);
    assert.equal(cost.effects[0], attack.arrow.cost);
    assert.ok(cost.effects[1] instanceof SelectDiscardCardEffect);
    assert.equal(await attack.arrow.canPay(params), false);

    player.hand.cards.push(discardableCard);
    assert.equal(await attack.arrow.canPay(params), true);

    assert.equal(await attack.arrow.pay(params), false);
    assert.equal(gameCard.exhausted, false);
    assert.equal(player.hand.cards.length, 1);

    confirmDiscard = true;
    assert.equal(await attack.arrow.pay(params), true);
    assert.equal(gameCard.exhausted, true);
    assert.equal(player.hand.cards.length, 0);
    assert.deepEqual(discarded, [discardableCard]);

    const otherAbility = {
        card: {},
        isAttack: true,
        isBasic: true,
    };
    assert.equal(
        await attack.arrow.getCost({...params, ability: otherAbility}),
        attack.arrow.cost
    );

    const nonBasicAttack = {
        card: gameCard,
        isAttack: true,
        isBasic: false,
    };
    assert.equal(
        await attack.arrow.getCost({...params, ability: nonBasicAttack}),
        attack.arrow.cost
    );
});
