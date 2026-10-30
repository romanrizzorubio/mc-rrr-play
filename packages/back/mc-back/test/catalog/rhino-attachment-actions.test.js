import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {CARD_TYPE_RESOURCE, CARD_TYPE_TREACHERY, DIALOG_PAY_COST, RESOURCE_PHYSICAL} from 'mc-shared';
import captainAmerica from '../../../mc-data/seed/catalog/heroes/captain-america.js';
import rhino from '../../../mc-data/seed/catalog/scenarios/rhino.js';
import {AttachEffect} from '../../src/effects/attach-effect.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';

describe('Rhino attachment actions', () => {
    const createGame = async (cancelPayment = false) => {
        const match = new Match({
            name: 'rhino-attachment-action',
            mc: {mcSocket: {send() {}}},
        });
        match.persist = async () => {};
        match.refresh = async () => {};
        match.skipDiscardOrderDialog = true;
        const factory = new MatchFactory(match);
        const player = match.createPlayer({
            name: 'Player',
            userId: 'captain-america-player',
            initial: true,
            superhero: factory.createSuperhero({
                ...captainAmerica.config,
                cards: [],
                precon: [],
                nemesis: [],
                obligation: undefined,
            }),
        });
        player.initPlayer();
        player.superhero.selectedSide = 1;
        match.currentPlayer = player;
        const dialogs = [];
        match.openDialog = async dialog => {
            dialogs.push(dialog);
            if (dialog.dialogType !== DIALOG_PAY_COST) {
                return {};
            }
            assert.ok(dialog.targetPlayer === player, 'Payment must target the acting player');
            assert.equal(dialog.data.card.name, 'Cuerno de marfil mejorado');
            assert.deepEqual(dialog.data.requirement,
                [RESOURCE_PHYSICAL, RESOURCE_PHYSICAL, RESOURCE_PHYSICAL]);
            if (cancelPayment) {
                return undefined;
            }
            return {
                paid: {
                    hand: player.hand.cards.map(card => ({id: card.id})),
                    generators: [],
                },
                resources: [RESOURCE_PHYSICAL, RESOURCE_PHYSICAL, RESOURCE_PHYSICAL],
                fullyPaid: true,
            };
        };
        match.scenario = await factory.createScenario({
            ...rhino.config,
            sets: [],
            defaultSets: [],
            cards: [],
        });
        await match.scenario.initScenario([], false);
        match.phase = 'players';
        match.playing = true;
        const villain = match.villain;
        const baseAttack = await villain.getAttackValue({player});
        const horn = factory.cardsFactory.createGameCardFromConfig(
            rhino.config.cards.find(({card}) =>
                card.params.name === 'Cuerno de marfil mejorado').card,
            {owner: match.scenario},
        );
        await new AttachEffect({
            card: horn,
            match,
            selectedTarget: villain,
        }).runEffect({player});
        await horn.initTriggers();
        const paymentCards = Array.from({length: 3}, (_, index) =>
            factory.cardsFactory.createGameCardFromConfig({
                type: CARD_TYPE_RESOURCE,
                params: {name: `Physical resource ${index}`, resources: [RESOURCE_PHYSICAL]},
            }, {owner: player}));
        player.hand.cards = paymentCards;
        player.deck.cards = [factory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_RESOURCE,
            params: {name: 'Remaining player card', resources: [RESOURCE_PHYSICAL]},
        }, {owner: player})];
        match.scenario.deck.cards = [factory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_TREACHERY,
            params: {name: 'Remaining encounter card', boost: 0},
        }, {owner: match.scenario})];
        dialogs.length = 0;
        return {match, player, horn, villain, baseAttack, paymentCards, dialogs};
    };

    test('Captain America opens payment for the horn, pays three physical resources and discards it', async () => {
        const {match, player, horn, villain, baseAttack, paymentCards, dialogs} = await createGame();
        assert.equal(player.superhero.currentSide.isHero, true);
        assert.ok(match.scenario.getCard(horn.id) === horn);
        assert.equal(await villain.getAttackValue({player}), baseAttack + 1);

        await player.resolveAbility(horn.id, 0);

        assert.equal(dialogs.filter(dialog => dialog.dialogType === DIALOG_PAY_COST).length, 1);
        assert.equal(player.hand.cards.length, 0);
        assert.ok(paymentCards.every(card => player.deck.discardPile.includes(card)));
        assert.equal(villain.attached.includes(horn), false);
        assert.ok(match.scenario.deck.discardPile.includes(horn));
        assert.ok(match.villain === villain, 'Discarding the horn must keep its villain in play');
        assert.equal(await villain.getAttackValue({player}), baseAttack);
    });

    test('canceling payment keeps the horn attached and all payment cards in hand', async () => {
        const {match, player, horn, villain, baseAttack, paymentCards, dialogs} =
            await createGame(true);

        await player.resolveAbility(horn.id, 0);

        assert.equal(dialogs.filter(dialog => dialog.dialogType === DIALOG_PAY_COST).length, 1);
        assert.ok(villain.attached.includes(horn));
        assert.equal(match.scenario.deck.discardPile.includes(horn), false);
        assert.deepEqual(player.hand.cards, paymentCards);
        assert.equal(player.deck.discardPile.length, 0);
        assert.equal(await villain.getAttackValue({player}), baseAttack + 1);
    });
});
