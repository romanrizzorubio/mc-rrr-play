import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    ABILITY_RESPONSE,
    CARD_TYPE_RESOURCE,
    DIALOG_SELECT_TARGET,
    DIALOG_USE_CARD,
    EFFECT_DRAW_CARD,
    RESOURCE_MENTAL,
    TARGET_ALL_PLAYERS,
    TRIGGER_CARD_ENTER_PLAY,
} from 'mc-shared';
import leadershipAllies from '../../../mc-data/seed/catalog/aspects/leadership/allies.js';
import blackWidow from '../../../mc-data/seed/catalog/heroes/black-widow.js';
import {PutPlayEffect} from '../../src/effects/put-play-effect.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';

describe('Maria Hill response', () => {
    const definition = leadershipAllies.find(({_id}) =>
        _id === 'leadership-maria-hill').card;
    const createGame = (count, acceptResponse = true) => {
        const match = new Match({
            name: 'maria-hill-response',
            mc: {mcSocket: {send() {}}},
        });
        match.scenario = {gameZone: {cards: []}};
        const factory = new MatchFactory(match);
        for (let index = 0; index < count; index++) {
            const player = match.createPlayer({
                name: `Player ${index}`,
                userId: `player-${index}`,
                initial: index === count - 1,
                superhero: factory.createSuperhero({
                    ...blackWidow.config,
                    cards: [],
                    precon: [],
                    obligation: undefined,
                    nemesis: [],
                }),
            });
            player.initPlayer();
            player.hand.refresh = async () => {};
            player.deck.refresh = async () => {};
            player.gameZone.refresh = async () => {};
            player.deck.cards = Array.from({length: 3}, (_, cardIndex) =>
                factory.cardsFactory.createGameCardFromConfig({
                    type: CARD_TYPE_RESOURCE,
                    params: {
                        name: `Card ${index}-${cardIndex}`,
                        resources: [RESOURCE_MENTAL],
                    },
                }, {owner: player}));
        }
        const owner = match.players[0];
        match.currentPlayer = owner;
        const maria = factory.cardsFactory.createGameCardFromConfig(
            definition, {owner});
        const dialogs = [];
        match.openDialog = async dialog => {
            dialogs.push(dialog);
            assert.notEqual(dialog.dialogType, DIALOG_SELECT_TARGET);
            assert.equal(dialog.dialogType, DIALOG_USE_CARD);
            return acceptResponse ? {selected: {id: maria.id}} : {};
        };
        const enter = card => new PutPlayEffect({
            card,
            selectedTarget: owner,
            match,
        }).runEffect({card, player: owner, match});

        return {dialogs, enter, factory, maria, match, owner};
    };

    test('defines an optional entry response drawing one card for each player', () => {
        const [ability] = definition.params.abilities;
        assert.equal(ability.type, ABILITY_RESPONSE);
        assert.equal(ability.params.trigger, TRIGGER_CARD_ENTER_PLAY);
        assert.deepEqual(ability.params.effect, {
            type: EFFECT_DRAW_CARD,
            params: {count: 1, target: TARGET_ALL_PLAYERS},
        });
    });

    test('every player draws exactly their own top card without any target selection in games of one to four players', async () => {
        for (let count = 1; count <= 4; count++) {
            const {dialogs, enter, maria, match, owner} = createGame(count);
            const topCards = match.players.map(player => player.deck.cards[0]);
            const [ability] = maria.abilities;
            assert.equal(typeof ability.effect.canRun, 'function');

            await enter(maria);

            assert.equal(maria.isInPlay, true);
            assert.equal(dialogs.length, 1);
            assert.equal(dialogs[0].targetPlayer.id, owner.id);
            for (const [index, player] of match.players.entries()) {
                assert.deepEqual(player.hand.cards, [topCards[index]]);
                assert.equal(player.deck.cards.length, 2);
            }
        }
    });

    test('declining the optional response makes nobody draw', async () => {
        const {enter, maria, match} = createGame(2, false);
        await enter(maria);
        assert.ok(match.players.every(player =>
            player.hand.cards.length === 0 && player.deck.cards.length === 3));
    });

    test('another ally entering play does not retrigger Maria Hill', async () => {
        const {dialogs, enter, factory, maria, match, owner} = createGame(2);
        await enter(maria);
        const other = factory.cardsFactory.createGameCardFromConfig(
            leadershipAllies.find(({_id}) => _id === 'leadership-wonder-man').card,
            {owner},
        );
        await enter(other);
        assert.equal(dialogs.length, 1);
        assert.ok(match.players.every(player => player.hand.cards.length === 1));
    });
});
