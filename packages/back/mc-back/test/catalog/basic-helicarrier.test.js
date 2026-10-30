import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    CARD_TYPE_RESOURCE,
    CARD_TYPE_SUPPORT,
    DIALOG_PAY_COST,
    DIALOG_SELECT_TARGET,
    PRIORITY_CONSTANT,
    RESOURCE_PHYSICAL,
    TRIGGER_PHASE_ENDS,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {PlayCardEffect} from '../../src/effects/play-card-effect.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Deck} from '../../src/model/match/deck.js';
import {Match} from '../../src/model/match/match.js';
import {PlayerZone} from '../../src/model/match/player-zone.js';

describe('Helitransporte', () => {
    const createGame = async () => {
        const catalog = await loadCatalog();
        const match = new Match({
            mc: {mcSocket: {send() {}}},
            name: 'helicarrier',
        });
        match.skipDiscardOrderDialog = true;
        match.scenario = {
            gameZone: {cards: []},
        };
        const factory = new MatchFactory(match);
        const dialogs = [];
        let nextIndex = 0;
        const createPlayer = (name, heroId, initial = false) => {
            const hero = catalog.heroes.find(({_id}) => _id === heroId);
            const player = match.createPlayer({
                name,
                superhero: factory.createSuperhero(hero.config),
                initial,
            });
            player.gameZone = new PlayerZone({owner: player});
            player.deck = new Deck({owner: player, isPlayerDeck: true});
            player.deck.cards.push({});
            player.deck.refresh = async () => {};
            player.gameZone.refresh = async () => {};
            player.hand.refresh = async () => {};

            return player;
        };
        const owner = createPlayer('Actor', 'hawkeye', true);
        const other = createPlayer('Elegido', 'thor');
        const third = createPlayer('Tercero', 'hulk');
        const createCard = (player, config) => {
            const card = factory.cardsFactory.createGameCardFromConfig(
                config,
                {index: ++nextIndex, owner: player},
            );
            card.refresh = async () => {};

            return card;
        };
        const record = catalog.aspects.find(({_id}) =>
            _id === 'basic-helicarrier');
        const helicarrier = createCard(owner, record.card);
        helicarrier.controller = owner;
        owner.gameZone.addToGameZone(helicarrier);
        let chosen = other;
        let cancelPayment = false;
        match.openDialog = async dialog => {
            dialogs.push(dialog);
            if (dialog.dialogType === DIALOG_SELECT_TARGET) {
                return {
                    selected: dialog.data.cards.find(({id}) => id === chosen.id),
                };
            }
            assert.equal(dialog.dialogType, DIALOG_PAY_COST);
            if (cancelPayment) {
                return undefined;
            }

            return {
                paid: {
                    hand: dialog.data.cards.hand.slice(0, dialog.data.cost),
                    generators: [],
                },
                resources: Array(dialog.data.cost).fill(RESOURCE_PHYSICAL),
            };
        };
        const activate = async player => {
            chosen = player;
            const [ability] = helicarrier.abilities;
            const params = {match, player: owner, card: helicarrier};
            const prepared = await ability.prepareToResolve(params);
            assert.equal(prepared.canRun, true);
            await ability.resolveAbility({
                ...params,
                preselectedTarget: prepared.preselectedTarget,
            });
            assert.equal(ability.resolved, true);
        };
        const play = async (player, cost = 2, cardOwner = player) => {
            const card = createCard(cardOwner, {
                type: CARD_TYPE_SUPPORT,
                params: {name: `Apoyo ${nextIndex}`, cost},
            });
            player.hand.cards.push(card);
            for (let i = 0; i < cost; i++) {
                player.hand.cards.push(createCard(player, {
                    type: CARD_TYPE_RESOURCE,
                    params: {
                        name: `Recurso ${nextIndex}`,
                        resources: [RESOURCE_PHYSICAL],
                    },
                }));
            }
            const effect = new PlayCardEffect({card, match});
            await effect.runEffect({match, player, card});

            return effect;
        };

        return {
            activate,
            dialogs,
            helicarrier,
            match,
            other,
            owner,
            play,
            third,
            cancelPayments(cancel = true) {
                cancelPayment = cancel;
            },
        };
    };

    test('lets only the actor choose an eligible player using public superhero cards and pays exhaustion', async () => {
        const {activate, dialogs, helicarrier, match, other, owner, third} =
            await createGame();
        assert.equal(helicarrier.exhausted, false);

        await activate(other);

        assert.equal(dialogs.length, 1);
        const [dialog] = dialogs;
        assert.equal(dialog.dialogType, DIALOG_SELECT_TARGET);
        assert.equal(dialog.targetPlayer, owner.id);
        assert.deepEqual(dialog.data.cards.map(({id}) => id), [
            owner.id, other.id, third.id,
        ]);
        for (const [index, player] of [owner, other, third].entries()) {
            const target = dialog.data.cards[index];
            assert.equal(target.name, player.superhero.name);
            assert.equal(target.image, player.superhero.toObj().image);
            assert.equal(target.showPlayerHero, true);
            assert.equal('hand' in target, false);
            assert.equal('deck' in target, false);
            assert.equal('superhero' in target, false);
        }
        assert.equal(helicarrier.exhausted, true);
        assert.equal(match.lasting.length, 1);
        assert.equal(match.lasting[0].selectedTarget, other);
        assert.equal(await helicarrier.abilities[0].canRun({
            match, player: owner, card: helicarrier,
        }), false);
    });

    for (const chooseSelf of [false, true]) {
        test(`discounts only the chosen ${chooseSelf ? 'actor' : 'other player'}'s next card and consumes once`, async () => {
            const game = await createGame();
            const {activate, dialogs, match, other, owner, play, third} = game;
            const selected = chooseSelf ? owner : other;
            const unselected = chooseSelf ? other : owner;
            await activate(selected);

            for (const player of [unselected, third]) {
                const effect = await play(player);
                assert.equal(effect.played, true);
                assert.equal(effect.modifyCost, 0);
                assert.equal(effect.resourcesPaid.length, 2);
                assert.equal(match.lasting.length, 1);
            }

            const discounted = await play(selected);
            assert.equal(discounted.played, true);
            assert.equal(discounted.modifyCost, -1);
            assert.equal(discounted.resourcesPaid.length, 1);
            assert.equal(match.lasting.length, 0);
            const next = await play(selected);
            assert.equal(next.played, true);
            assert.equal(next.modifyCost, 0);
            assert.equal(next.resourcesPaid.length, 2);
            assert.equal(dialogs.filter(({dialogType}) =>
                dialogType === DIALOG_SELECT_TARGET).length, 1);
        });
    }

    test('scopes the discount to the player playing the card, not its owner', async () => {
        const {activate, match, other, owner, play} = await createGame();
        await activate(other);

        const unselectedPlay = await play(owner, 2, other);
        assert.equal(unselectedPlay.modifyCost, 0);
        assert.equal(unselectedPlay.resourcesPaid.length, 2);
        assert.equal(match.lasting.length, 1);

        const selectedPlay = await play(other, 2, owner);
        assert.equal(selectedPlay.played, true);
        assert.equal(selectedPlay.resourcesPaid.length, 1);
        assert.equal(match.lasting.length, 0);
    });

    test('expires at the phase end even if another player ends the phase', async () => {
        const {activate, match, other, owner, play} = await createGame();
        await activate(other);

        await owner.superhero.trigger(PRIORITY_CONSTANT, [TRIGGER_PHASE_ENDS], {
            match, player: owner, effect: {},
        });

        assert.equal(match.lasting.length, 0);
        const effect = await play(other);
        assert.equal(effect.played, true);
        assert.equal(effect.modifyCost, 0);
        assert.equal(effect.resourcesPaid.length, 2);
    });

    test('consumes the next zero-cost card without creating a negative payment', async () => {
        const {activate, match, other, play} = await createGame();
        await activate(other);

        const free = await play(other, 0);
        assert.equal(free.played, true);
        assert.equal(free.modifyCost, -1);
        assert.equal(free.resourcesPaid.length, 0);
        assert.equal(match.lasting.length, 0);
        assert.equal((await play(other)).resourcesPaid.length, 2);
    });

    test('does not consume the reduction when payment is canceled', async () => {
        const {activate, cancelPayments, match, other, play} = await createGame();
        await activate(other);
        cancelPayments();

        const canceled = await play(other);
        assert.equal(canceled.played, false);
        assert.equal(canceled.paymentCancelled, true);
        assert.equal(match.lasting.length, 1);
        cancelPayments(false);
        const retry = await play(other);
        assert.equal(retry.played, true);
        assert.equal(retry.resourcesPaid.length, 1);
        assert.equal(match.lasting.length, 0);
    });
});
