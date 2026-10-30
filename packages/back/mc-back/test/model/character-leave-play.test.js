import assert from 'node:assert/strict';
import {describe, test} from 'node:test';
import {CARD_TYPE_RESOURCE, DECK_POSITION_TOP} from 'mc-shared';
import basicAllies from '../../../mc-data/seed/catalog/aspects/basic/allies.js';
import hulk from '../../../mc-data/seed/catalog/heroes/hulk.js';
import {Match} from '../../src/model/match/match.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {ReturnHandEffect} from '../../src/effects/return-hand-effect.js';
import {MoveToDeckEffect} from '../../src/effects/move-to-deck-effect.js';
import {RemoveCardEffect} from '../../src/effects/remove-card-effect.js';

describe('Character status cleanup on leaving play', () => {
    const createFixture = () => {
        const match = new Match({name: 'character-leave-play', mc: {mcSocket: {send() {}}}});
        const factory = new MatchFactory(match);
        match.scenario = {gameZone: {cards: []}, minions: [], schemes: []};
        const player = match.createPlayer({
            name: 'Hulk', initial: true,
            superhero: factory.createSuperhero({...hulk.config, cards: [], precon: [], nemesis: []}),
        });
        player.initPlayer();
        player.deck.cards.push(factory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_RESOURCE, params: {name: 'Remaining deck card'},
        }, {owner: player}));
        const nick = factory.cardsFactory.createGameCardFromConfig(
            basicAllies.find(({_id}) => _id === 'basic-nick-fury').card, {owner: player},
        );
        player.gameZone.addToGameZone(nick);
        nick.controller = player;
        nick.tough = 1;
        nick.stunned = 1;
        nick.confused = 1;
        return {match, player, nick};
    };

    for (const destination of ['hand', 'discard', 'deck', 'removed', 'defeated']) {
        test(`clears all Nick Fury statuses when moved to ${destination}`, async () => {
            const {match, player, nick} = createFixture();
            if (destination === 'hand') {
                await new ReturnHandEffect({match, selectedTarget: nick}).runEffect({player});
                assert.ok(player.hand.cards.includes(nick));
            } else if (destination === 'deck') {
                await new MoveToDeckEffect({
                    match, selectedTarget: player.deck, position: DECK_POSITION_TOP,
                }).runEffect({player, selectedCards: [nick]});
                assert.equal(player.deck.cards[0], nick);
            } else if (destination === 'removed') {
                await new RemoveCardEffect({match, selectedTarget: nick}).runEffect({player});
            } else if (destination === 'defeated') {
                await nick.defeat(player);
                assert.ok(player.deck.discardPile.includes(nick));
            } else {
                await nick.discard();
                assert.ok(player.deck.discardPile.includes(nick));
            }
            assert.equal(player.gameZone.cards.includes(nick), false);
            assert.deepEqual(nick.toObj().statusCards, {tough: 0, stunned: 0, confused: 0});
            assert.equal(nick.damage, 0);
        });
    }

    test('flipping identity without leaving play preserves statuses on both sides', async () => {
        const {player} = createFixture();
        const superhero = player.superhero;
        superhero.tough = 1;
        superhero.stunned = 1;
        superhero.confused = 1;
        await superhero.flipToSide(1, {});
        assert.deepEqual([superhero.tough, superhero.stunned, superhero.confused], [1, 1, 1]);
        for (const side of superhero.sides) {
            assert.deepEqual([side.tough, side.stunned, side.confused], [1, 1, 1]);
        }
    });
});
