import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    ABILITY_ACTION,
    ABILITY_RESPONSE,
    CARD_TYPE_RESOURCE,
    CARD_TYPE_SUPPORT,
    EFFECT_CHAINED,
    EFFECT_DISCARD_GAME,
    EFFECT_DRAW_CARD,
    EFFECT_EXHAUST,
    EFFECT_SPEND,
    PRIORITY_RESPONSE,
    RESOURCE_ENERGY,
    TARGET_ANY_PLAYER,
    TARGET_THIS,
    TARGET_YOU,
    TARGET_YOUR_SUPERHERO,
    TRIGGER_END_PLAY_CARD,
} from 'mc-shared';
import blackWidow from '../../../mc-data/seed/catalog/heroes/black-widow.js';
import captainMarvel from '../../../mc-data/seed/catalog/heroes/captain-marvel.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';

describe('Independent effect contexts for heroes of the same account', () => {
    const createGame = ({discardSource = false, payResources = false} = {}) => {
        const match = new Match({
            name: 'multi-hero-effect-context',
            mc: {mcSocket: {send() {}}},
        });
        match.scenario = {gameZone: {cards: []}};
        const sourceConfig = {
            type: CARD_TYPE_SUPPORT,
            params: {
                name: 'Shared support',
                set: 'basic',
                cost: 0,
                abilities: [
                    {
                        type: ABILITY_ACTION,
                        params: {
                            name: 'Draw for another hero and yourself',
                            arrow: {
                                type: discardSource ? EFFECT_DISCARD_GAME : EFFECT_EXHAUST,
                                params: {target: TARGET_THIS},
                            },
                            effect: discardSource ? {
                                type: EFFECT_DRAW_CARD,
                                params: {target: TARGET_YOU},
                            } : {
                                type: EFFECT_CHAINED,
                                params: {
                                    effects: [
                                        {
                                            type: EFFECT_DRAW_CARD,
                                            params: {target: TARGET_ANY_PLAYER},
                                        },
                                        {
                                            type: EFFECT_DRAW_CARD,
                                            params: {target: TARGET_YOU},
                                        },
                                    ],
                                },
                            },
                        },
                    },
                    {
                        type: ABILITY_RESPONSE,
                        params: {
                            name: 'Exhaust your hero and draw',
                            hideDialog: true,
                            trigger: TRIGGER_END_PLAY_CARD,
                            arrow: payResources ? {
                                type: EFFECT_SPEND,
                                params: {resources: [RESOURCE_ENERGY]},
                            } : {
                                type: EFFECT_EXHAUST,
                                params: {target: TARGET_YOUR_SUPERHERO},
                            },
                            effect: {
                                type: EFFECT_DRAW_CARD,
                                params: {target: TARGET_YOU},
                            },
                        },
                    },
                ],
            },
        };
        const players = [blackWidow, captainMarvel].map((hero, index) => {
            const factory = new MatchFactory(match);
            const superhero = factory.createSuperhero({
                ...hero.config,
                cards: [],
                obligation: undefined,
                nemesis: [],
                precon: [
                    {count: 1, card: sourceConfig},
                    {
                        count: 4,
                        card: {
                            type: CARD_TYPE_RESOURCE,
                            params: {
                                name: 'Shared resource',
                                set: 'basic',
                                resources: [RESOURCE_ENERGY],
                            },
                        },
                    },
                ],
            });
            const source = superhero.deck[0];
            const player = match.createPlayer({
                id: `hero-seat-${index}`,
                userId: 'same-account',
                name: `Player (${index + 1})`,
                superhero,
            });
            player.initPlayer();
            player.deck.cards = superhero.deck.slice(1);
            source.owner = player;
            source.controller = player;
            player.gameZone.addToGameZone(source);
            return player;
        });
        return {match, players, sources: players.map(player => player.gameZone.cards[0])};
    };

    test('two identical response cards retain their own hero, costs and hand in one trigger window', async () => {
        const {match, players, sources} = createGame();
        await Promise.all(sources.map(source => source.initTriggers()));
        assert.equal(Object.values(match.triggerCards).includes(sources[0]), true);
        assert.equal(Object.values(match.triggerCards).includes(sources[1]), true);
        const params = {player: players[0], card: sources[0], effect: {resolved: true}};

        await match.trigger(PRIORITY_RESPONSE, [TRIGGER_END_PLAY_CARD], params);

        assert.equal(players[0].superhero.exhausted, true);
        assert.equal(players[1].superhero.exhausted, true);
        assert.equal(players[0].hand.cards.length, 1);
        assert.equal(players[1].hand.cards.length, 1);
        assert.equal(players[0].hand.cards[0].owner, players[0]);
        assert.equal(players[1].hand.cards[0].owner, players[1]);
        assert.equal(params.player, players[0]);
        assert.equal(sources[0].abilities[1].effect.selectedTarget, players[0]);
        assert.equal(sources[1].abilities[1].effect.selectedTarget, players[1]);
    });

    test('a chained action keeps the initiating hero after choosing the other owned hero', async () => {
        const {match, players, sources} = createGame();
        const dialogs = [];
        match.openDialog = async dialog => {
            dialogs.push(dialog);
            assert.equal(dialog.targetPlayer, players[0].id);
            assert.deepEqual(dialog.data.cards.map(card => card.id), players.map(player => player.id));
            return {selected: dialog.data.cards[1]};
        };

        await players[0].resolveAbility(sources[0].id, 0);

        assert.equal(dialogs.length, 1);
        assert.equal(sources[0].exhausted, true);
        assert.equal(sources[1].exhausted, false);
        assert.equal(players[0].hand.cards.length, 1);
        assert.equal(players[1].hand.cards.length, 1);
        assert.equal(sources[0].abilities[0].effect.effects[0].selectedTarget, players[1]);
        assert.equal(sources[0].abilities[0].effect.effects[1].selectedTarget, players[0]);
    });

    test('the second hero resolves its own same-title card without reusing the first hero effect results', async () => {
        const {match, players, sources} = createGame();
        let requester = players[0];
        match.openDialog = async dialog => {
            assert.equal(dialog.targetPlayer, requester.id);
            return {selected: dialog.data.cards.find(card => card.id !== requester.id)};
        };
        await players[0].resolveAbility(sources[0].id, 0);
        const firstResolution = sources[0].abilities[0].effect;
        requester = players[1];
        await players[1].resolveAbility(sources[1].id, 0);

        assert.equal(sources[0].exhausted, true);
        assert.equal(sources[1].exhausted, true);
        assert.equal(players[0].hand.cards.length, 2);
        assert.equal(players[1].hand.cards.length, 2);
        assert.notEqual(firstResolution, sources[1].abilities[0].effect);
        assert.equal(sources[1].abilities[0].effect.effects[0].selectedTarget, players[0]);
        assert.equal(sources[1].abilities[0].effect.effects[1].selectedTarget, players[1]);
    });

    test('a response pays only from its controller hand when the other owned hero cannot pay', async () => {
        const {match, players, sources} = createGame({payResources: true});
        const [paymentCard] = await players[1].deck.draw();
        players[1].hand.addCard(paymentCard);
        await Promise.all(sources.map(source => source.initTriggers()));
        const dialogs = [];
        match.openDialog = async dialog => {
            dialogs.push(dialog);
            assert.equal(dialog.targetPlayer.id, players[1].id);
            assert.deepEqual(dialog.data.cards.hand.map(card => card.id), [paymentCard.id]);
            return {
                fullyPaid: true,
                resources: [RESOURCE_ENERGY],
                paid: {hand: [dialog.data.cards.hand[0]], generators: []},
            };
        };

        const params = {
            player: players[0],
            card: sources[0],
            effect: {resolved: true},
        };
        const response = sources[1].triggers[TRIGGER_END_PLAY_CARD][PRIORITY_RESPONSE][0];
        assert.equal(await response.canTrigger(params), true);
        await response.runTrigger(params);

        assert.equal(dialogs.length, 1);
        assert.equal(players[0].hand.cards.length, 0);
        assert.equal(players[0].deck.discardPile.length, 0);
        assert.equal(players[1].deck.discardPile.includes(paymentCard), true);
        assert.equal(players[1].hand.cards.length, 1);
        assert.notEqual(players[1].hand.cards[0], paymentCard);
        assert.equal(players[1].hand.cards[0].owner, players[1]);
        assert.equal(params.player.id, players[0].id);
    });

    test('discarding the source as a cost cannot redirect the remaining effect to the other hero', async () => {
        const {players, sources} = createGame({discardSource: true});
        await players[0].resolveAbility(sources[0].id, 0);

        assert.equal(sources[0].controller, undefined);
        assert.equal(players[0].gameZone.cards.includes(sources[0]), false);
        assert.equal(players[0].deck.discardPile.includes(sources[0]), true);
        assert.equal(players[0].hand.cards.length, 1);
        assert.equal(players[0].hand.cards[0].owner, players[0]);
        assert.equal(players[1].gameZone.cards.includes(sources[1]), true);
        assert.equal(players[1].hand.cards.length, 0);
        assert.equal(sources[0].abilities[0].effect.selectedTarget, players[0]);
    });
});
